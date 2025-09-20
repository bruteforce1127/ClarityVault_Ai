package com.kucp1127.clarityvault.FileProcessing.Service;


import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

@Service
public class FileProcessingService {

    private final WebClient webClient;

    @Value("${google.api.key}")
    private String apiKey;

    public FileProcessingService(WebClient.Builder webClientBuilder) {

        this.webClient = webClientBuilder.baseUrl("https://generativelanguage.googleapis.com").build();
    }

    public JsonNode getResponse(MultipartFile file, String prompt) throws Exception {
        String fileUri = uploadFileToGoogle(file);
        return generateContent(fileUri, prompt);
    }
    private String uploadFileToGoogle(MultipartFile file) throws Exception {
        String uploadUrl = "https://generativelanguage.googleapis.com/upload/v1beta/files?key=" + apiKey;

        HttpHeaders startHeaders = new HttpHeaders();
        startHeaders.set("X-Goog-Upload-Protocol", "resumable");
        startHeaders.set("X-Goog-Upload-Command", "start");
        startHeaders.set("X-Goog-Upload-Header-Content-Length", String.valueOf(file.getSize()));
        startHeaders.set("X-Goog-Upload-Header-Content-Type", file.getContentType());
        startHeaders.setContentType(MediaType.APPLICATION_JSON);

        String jsonBody = "{\"file\": {\"display_name\": \"" + file.getOriginalFilename() + "\"}}";

        RestTemplate restTemplate = new RestTemplate();
        HttpEntity<String> startRequest = new HttpEntity<>(jsonBody, startHeaders);
        ResponseEntity<String> startResponse = restTemplate.exchange(uploadUrl, HttpMethod.POST, startRequest, String.class);

        String sessionUri = startResponse.getHeaders().getFirst("X-Goog-Upload-URL");
        if (sessionUri == null || sessionUri.isEmpty()) {
            throw new Exception("Failed to obtain upload session URI.");
        }

        HttpHeaders uploadHeaders = new HttpHeaders();
        uploadHeaders.set("X-Goog-Upload-Protocol", "resumable");
        uploadHeaders.set("X-Goog-Upload-Command", "upload, finalize");
        uploadHeaders.set("X-Goog-Upload-Offset", "0");
        uploadHeaders.setContentType(MediaType.APPLICATION_OCTET_STREAM);

        HttpEntity<byte[]> uploadRequest = new HttpEntity<>(file.getBytes(), uploadHeaders);
        ResponseEntity<String> uploadResponse = restTemplate.exchange(sessionUri, HttpMethod.POST, uploadRequest, String.class);

        return new ObjectMapper().readTree(uploadResponse.getBody()).path("file").path("uri").asText();
    }

    public JsonNode generateContent(String fileUri, String prompt) throws Exception {
        String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" + apiKey;

        String requestBody = "{ \"contents\": [ { \"role\": \"user\", \"parts\": [ { \"fileData\": { \"fileUri\": \"" + fileUri + "\" } }, { \"text\": \"" + prompt + "\" } ] } ] }";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        RestTemplate restTemplate = new RestTemplate();
        HttpEntity<String> entity = new HttpEntity<>(requestBody, headers);
        ResponseEntity<String> response = restTemplate.postForEntity(url, entity, String.class);

        return new ObjectMapper().readTree(response.getBody());
    }

    public Mono<String> generateTranslation(String prompt , String language) {


        String updatedPrompt = " "+ prompt +
                "\n"+
                "given the text above translate the given text in given"+ language +
                " and maintain the original structure and formatting as much as possible. and dont give extra text"
                ;

        Map<String, Object> textPart = new HashMap<>();
        textPart.put("text", updatedPrompt);

        Map<String, Object> partsWrapper = new HashMap<>();
        partsWrapper.put("parts", Collections.singletonList(textPart));

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("contents", Collections.singletonList(partsWrapper));

        return webClient.post()
                .uri(uriBuilder -> uriBuilder
                        .path("/v1beta/models/gemini-2.0-flash:generateContent")
                        .queryParam("key", apiKey)
                        .build())
                .header("Content-Type", MediaType.APPLICATION_JSON_VALUE)
                .body(BodyInserters.fromValue(requestBody))
                .retrieve()
                .bodyToMono(String.class);
    }

    public Mono<String> analyzeText(String text, String language, String documentType) {
        String analysisPrompt;

        // Check if it's a small section or just wants meaning explanation
        if (documentType.toLowerCase().contains("meaning") || documentType.toLowerCase().contains("definition") ||
            documentType.toLowerCase().contains("explain") || text.length() < 500) {

            analysisPrompt = "Explain the meaning and significance of the following text in " + language + ":\n\n" +
                    "Text: " + text + "\n\n" +
                    "Document/Section Type: " + documentType + "\n\n" +
                    "Please provide:\n" +
                    "1. MEANING: Clear explanation of what this text means\n" +
                    "2. KEY TERMS: Definition of any technical, legal, or specialized terms\n" +
                    "3. CONTEXT: Why this is important in the context of " + documentType + "\n" +
                    "4. IMPLICATIONS: What this means for the parties involved\n\n" +
                    "Keep the explanation clear and concise in " + language + ".";

        } else {
            // Full document analysis
            analysisPrompt = "Analyze the following " + documentType + " document and provide a comprehensive analysis in " + language + ":\n\n" +
                    "Document Text: " + text + "\n\n" +
                    "Document Type: " + documentType + "\n\n" +
                    "Please provide analysis in the following format:\n\n" +
                    "DOCUMENT OVERVIEW:\n" +
                    "- Brief description of this " + documentType + " and its purpose\n\n" +
                    "KEY TERMS AND DEFINITIONS:\n" +
                    "- [List and explain any technical, financial, or legal terms specific to " + documentType + "]\n\n" +
                    "FINANCIAL CALCULATIONS (if applicable):\n" +
                    "- [For financial documents, perform relevant calculations such as:\n" +
                    "  * Total amounts, interest calculations, payment schedules\n" +
                    "  * Monthly/yearly costs, percentages, rates\n" +
                    "  * Due dates, penalties, late fees]\n\n" +
                    "IMPORTANT CLAUSES AND OBLIGATIONS:\n" +
                    "- [Highlight key responsibilities, rights, and obligations of parties involved]\n\n" +
                    "CRITICAL DATES AND DEADLINES:\n" +
                    "- [Extract and list any important dates, deadlines, or time-sensitive information]\n\n" +
                    "RISKS AND CONCERNS:\n" +
                    "- [Identify potential risks, penalties, or areas of concern specific to " + documentType + "]\n\n" +
                    "ACTIONABLE ITEMS:\n" +
                    "- [What actions need to be taken based on this " + documentType + "]\n\n" +
                    "SUMMARY:\n" +
                    "- [Provide a concise summary of the document's purpose and main points]\n\n" +
                    "Please ensure all explanations are clear and in " + language + " language.";
        }

        Map<String, Object> textPart = new HashMap<>();
        textPart.put("text", analysisPrompt);

        Map<String, Object> partsWrapper = new HashMap<>();
        partsWrapper.put("parts", Collections.singletonList(textPart));

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("contents", Collections.singletonList(partsWrapper));

        return webClient.post()
                .uri(uriBuilder -> uriBuilder
                        .path("/v1beta/models/gemini-2.0-flash:generateContent")
                        .queryParam("key", apiKey)
                        .build())
                .header("Content-Type", MediaType.APPLICATION_JSON_VALUE)
                .body(BodyInserters.fromValue(requestBody))
                .retrieve()
                .bodyToMono(String.class);
    }

}
