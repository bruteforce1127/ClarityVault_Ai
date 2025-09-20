package com.kucp1127.clarityvault.FileProcessing.Controller;


import com.kucp1127.clarityvault.FileProcessing.Service.FileProcessingService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.kucp1127.clarityvault.FileProcessing.Service.YouTubeVideoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;
import java.util.Objects;

@RestController
@CrossOrigin("*")
public class FileProcessingController {

    @Autowired
    private FileProcessingService fileProcessingService;

    @Autowired
    private YouTubeVideoService youTubeVideoService;

    @PostMapping("/pdf_translation")
    public ResponseEntity<?> convertPdfToLanguage(
            @RequestParam("file") MultipartFile pdfFile,
            @RequestParam("language") String language) {

        try {
            // Validate that the uploaded file is a PDF
            if (!Objects.equals(pdfFile.getContentType(), "application/pdf")) {
                return ResponseEntity.badRequest().body("Only PDF files are supported");
            }

            // Create prompt for language conversion
            String prompt = "Please convert the content of this PDF document to " + language +
                          ". Maintain the original structure and formatting as much as possible. " +
                          "Provide a clear and accurate translation of all text content.";

            // Call the service to process the PDF
            JsonNode response = fileProcessingService.getResponse(pdfFile, prompt);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body("Error processing PDF: " + e.getMessage());
        }
    }

    @PostMapping("/text_translation")
    public ResponseEntity<?> translateTextToLanguage(
            @RequestParam("text") String text,
            @RequestParam("language") String language) {
        try {
            // Get the Mono<String> from service and extract the actual string content
            String translation = fileProcessingService.generateTranslation(text, language).block();

            // Parse the JSON response to extract only the translated text
            ObjectMapper objectMapper = new ObjectMapper();
            JsonNode jsonResponse = objectMapper.readTree(translation);

            // Extract the translated text from the API response structure
            if (jsonResponse.has("candidates") && jsonResponse.get("candidates").isArray()) {
                JsonNode candidates = jsonResponse.get("candidates");
                if (!candidates.isEmpty()) {
                    JsonNode content = candidates.get(0).get("content");
                    if (content != null && content.has("parts")) {
                        JsonNode parts = content.get("parts");
                        if (parts.isArray() && !parts.isEmpty()) {
                            String translatedText = parts.get(0).get("text").asText();
                            return ResponseEntity.ok(translatedText);
                        }
                    }
                }
            }

            // If we couldn't extract the text, return the raw response
            return ResponseEntity.ok(translation);

        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body("Error translating text: " + e.getMessage());
        }
    }

    @PostMapping("/pdf_jargon_extraction")
    public ResponseEntity<?> extractJargonFromPdf(
            @RequestParam("file") MultipartFile pdfFile,
            @RequestParam("language") String language) {

        try {
            // Validate that the uploaded file is a PDF
            if (pdfFile.getContentType() == null || !pdfFile.getContentType().equals("application/pdf")) {
                return ResponseEntity.badRequest().body("Only PDF files are supported");
            }


            String prompt = "Analyze this PDF document to identify and summarize its most important sections and key clauses. " +
                    "Your goal is to make a complex document easy to navigate and understand.\n\n" +
                    "For each critical section you identify, provide the output in the following exact format:\n\n" +
                    "SECTION: [The name or title of the key section, e.g., 'Limitation of Liability']\n" +
                    "PAGE: [The exact page number where the section begins]\n" +
                    "SUMMARY: [A brief, easy-to-understand summary of what this section means and its implications, written in " + language + "]\n" +
                    "---\n\n" +
                    "Please focus on locating and explaining sections related to:\n" +
                    "- Core obligations and responsibilities of the parties\n" +
                    "- Financial elements like payment terms, fees, and penalties\n" +
                    "- Legal and liability clauses (Indemnification, Limitation of Liability, Governing Law)\n" +
                    "- The duration of the agreement (Term and Termination)\n" +
                    "- Confidentiality and data protection\n" +
                    "- Dispute resolution processes\n\n" +
                    "Provide summaries in " + language + " and ensure they are clear and concise for a general audience.";

            // Call the service to process the PDF
            JsonNode response = fileProcessingService.getResponse(pdfFile, prompt);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body("Error extracting jargon from PDF: " + e.getMessage());
        }
    }

    @GetMapping("/search")
    public ResponseEntity<List<String>> searchVideos(
            @RequestParam String title,
            @RequestParam String language) {

        List<String> videoLinks = youTubeVideoService.searchVideosByTitleAndLanguage(title, language);
        return ResponseEntity.ok(videoLinks);
    }

    @PostMapping("/find_Document_type")
    public ResponseEntity<?> findDocumentType(@RequestParam("file") MultipartFile file) {
        try {

            if (!Objects.equals(file.getContentType(), "application/pdf")) {
                return ResponseEntity.badRequest().body("Only PDF files are supported");
            }

            String prompt = "Identify the type of this document (e.g., contract, invoice, report, etc.) whether" +
                    " it is a legal, financial, or technical document. give it in a single word or short phrase";

            JsonNode response = fileProcessingService.getResponse(file, prompt);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body("Error processing PDF: " + e.getMessage());
        }
    }

    @PostMapping("/analyze_text")
    public ResponseEntity<?> analyzeText(
            @RequestParam("text") String text,
            @RequestParam("language") String language,
            @RequestParam("documentType") String documentType) {
        try {
            // Get the Mono<String> from service and extract the actual string content
            String analysis = fileProcessingService.analyzeText(text, language, documentType).block();

            // Parse the JSON response to extract only the analysis text
            ObjectMapper objectMapper = new ObjectMapper();
            JsonNode jsonResponse = objectMapper.readTree(analysis);

            // Extract the analysis text from the API response structure
            if (jsonResponse.has("candidates") && jsonResponse.get("candidates").isArray()) {
                JsonNode candidates = jsonResponse.get("candidates");
                if (!candidates.isEmpty()) {
                    JsonNode content = candidates.get(0).get("content");
                    if (content != null && content.has("parts")) {
                        JsonNode parts = content.get("parts");
                        if (parts.isArray() && !parts.isEmpty()) {
                            String analysisText = parts.get(0).get("text").asText();
                            return ResponseEntity.ok(analysisText);
                        }
                    }
                }
            }

            // If we couldn't extract the text, return the raw response
            return ResponseEntity.ok(analysis);

        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body("Error analyzing text: " + e.getMessage());
        }
    }

    @PostMapping("/analyze_harmful_terms")
    public ResponseEntity<?> analyzeHarmfulTerms(@RequestParam("file") MultipartFile pdfFile) {
        try {
            // Validate that the uploaded file is a PDF
            if (!Objects.equals(pdfFile.getContentType(), "application/pdf")) {
                return ResponseEntity.badRequest().body("Only PDF files are supported");
            }

            // Create a comprehensive prompt to analyze harmful terms and conditions
            String harmfulTermsPrompt = "Carefully analyze this PDF document to identify potentially harmful, unfair, or risky terms and conditions that could negatively impact the client or party agreeing to this document.\n\n" +
                    "For each potentially harmful term or condition you identify, provide the output in the following exact format:\n\n" +
                    "HARMFUL TERM: [Brief title of the problematic clause]\n" +
                    "PAGE: [Exact page number where this term appears]\n" +
                    "RISK LEVEL: [HIGH/MEDIUM/LOW]\n" +
                    "DESCRIPTION: [Detailed explanation of what this term means and why it's potentially harmful]\n" +
                    "POTENTIAL IMPACT: [How this could negatively affect the client/party]\n" +
                    "RECOMMENDATION: [What action should be taken - negotiate, reject, seek legal advice, etc.]\n" +
                    "---\n\n" +
                    "Focus specifically on identifying:\n" +
                    "• Unfair liability clauses that put excessive responsibility on one party\n" +
                    "• Hidden fees, penalties, or unexpected charges\n" +
                    "• Automatic renewal clauses without clear opt-out mechanisms\n" +
                    "• Broad termination rights favoring one party\n" +
                    "• Excessive limitation of liability for the service provider\n" +
                    "• Broad indemnification requirements\n" +
                    "• Unreasonable confidentiality or non-compete clauses\n" +
                    "• Vague or ambiguous language that could be interpreted unfavorably\n" +
                    "• Unfair dispute resolution mechanisms\n" +
                    "• Intellectual property clauses that transfer excessive rights\n" +
                    "• Data privacy concerns or broad data usage rights\n" +
                    "• Unreasonable performance standards or service level agreements\n\n" +
                    "If no harmful terms are found, state: 'NO HARMFUL TERMS IDENTIFIED - This document appears to have fair and balanced terms.'\n\n" +
                    "Provide clear, actionable advice for each identified risk.";

            // Call the service to process the PDF
            JsonNode response = fileProcessingService.getResponse(pdfFile, harmfulTermsPrompt);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body("Error analyzing harmful terms in PDF: " + e.getMessage());
        }
    }

    @PostMapping("/analyze_contract_alternatives")
    public ResponseEntity<?> analyzeContractAndFindAlternatives(@RequestParam("file") MultipartFile pdfFile) {
        try {
            // Validate that the uploaded file is a PDF
            if (!Objects.equals(pdfFile.getContentType(), "application/pdf")) {
                return ResponseEntity.badRequest().body("Only PDF files are supported");
            }

            // Create a comprehensive prompt to analyze the contract and find alternatives
            String contractAnalysisPrompt = "Perform a comprehensive analysis of this contract document and provide alternative contract recommendations based on your knowledge database.\n\n" +
                    "PHASE 1 - CONTRACT ANALYSIS:\n" +
                    "First, analyze this contract thoroughly and provide:\n\n" +
                    "CONTRACT TYPE: [Identify the specific type of contract - e.g., Service Agreement, Employment Contract, Lease Agreement, etc.]\n" +
                    "KEY TERMS SUMMARY:\n" +
                    "• Duration: [Contract term/duration]\n" +
                    "• Financial Terms: [Payment amounts, schedules, fees]\n" +
                    "• Main Obligations: [Key responsibilities of each party]\n" +
                    "• Termination Conditions: [How and when the contract can be terminated]\n" +
                    "• Risk Factors: [Identify any concerning clauses or terms]\n\n" +
                    "CONTRACT STRENGTHS:\n" +
                    "• [List 3-4 positive aspects of this contract]\n\n" +
                    "CONTRACT WEAKNESSES:\n" +
                    "• [List 3-4 areas where this contract could be improved]\n\n" +
                    "OVERALL RATING: [Rate this contract from 1-10 with brief justification]\n\n" +
                    "---\n\n" +
                    "PHASE 2 - ALTERNATIVE CONTRACT RECOMMENDATIONS:\n" +
                    "Based on the contract type identified, search your knowledge base and provide 4-5 alternative contract templates or approaches that could be better suited. For each alternative, provide:\n\n" +
                    "ALTERNATIVE 1: [Name/Type of alternative contract]\n" +
                    "DESCRIPTION: [Brief description of this alternative approach]\n" +
                    "ADVANTAGES OVER CURRENT CONTRACT:\n" +
                    "• [Specific benefits compared to the analyzed contract]\n" +
                    "• [How it addresses weaknesses in the current contract]\n" +
                    "POTENTIAL DRAWBACKS:\n" +
                    "• [Any limitations or downsides of this alternative]\n" +
                    "BEST FOR: [What situations or parties this alternative works best for]\n" +
                    "RECOMMENDATION SCORE: [Rate 1-10 how much better this is than current contract]\n\n" +
                    "[Repeat this format for ALTERNATIVE 2, 3, 4, and 5]\n\n" +
                    "---\n\n" +
                    "PHASE 3 - FINAL RECOMMENDATIONS:\n" +
                    "SHOULD CLIENT KEEP CURRENT CONTRACT?: [Yes/No with detailed reasoning]\n\n" +
                    "TOP RECOMMENDED ALTERNATIVE: [Which alternative is best and why]\n\n" +
                    "ACTION PLAN:\n" +
                    "• [Immediate steps the client should take]\n" +
                    "• [Long-term contract strategy recommendations]\n" +
                    "• [What to negotiate if staying with current contract]\n\n" +
                    "RISK MITIGATION:\n" +
                    "• [How to reduce risks in current contract]\n" +
                    "• [How alternatives better protect the client]\n\n" +
                    "Note: Base your alternative recommendations on widely available contract templates, industry standards, and best practices from your training data. Focus on practical, implementable alternatives that address the specific weaknesses identified in the client's current contract.";

            // Call the service to process the PDF
            JsonNode response = fileProcessingService.getResponse(pdfFile, contractAnalysisPrompt);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body("Error analyzing contract and finding alternatives: " + e.getMessage());
        }
    }

    @PostMapping("/analyze_loan_document")
    public ResponseEntity<?> analyzeLoanDocument(@RequestParam("file") MultipartFile pdfFile) {
        try {
            // Validate that the uploaded file is a PDF
            if (!Objects.equals(pdfFile.getContentType(), "application/pdf")) {
                return ResponseEntity.badRequest().body("Only PDF files are supported");
            }

            // Create a comprehensive prompt for loan document analysis with EMI calculations
            String loanAnalysisPrompt = "Perform a comprehensive financial analysis of this loan document and provide detailed EMI calculations and payment breakdown.\n\n" +

                    "PHASE 1 - LOAN DOCUMENT ANALYSIS:\n" +
                    "Extract and analyze the following key information from the loan document:\n\n" +

                    "LOAN BASIC DETAILS:\n" +
                    "• Loan Type: [Personal Loan/Home Loan/Car Loan/Business Loan/etc.]\n" +
                    "• Principal Amount: [Total loan amount sanctioned]\n" +
                    "• Interest Rate: [Annual percentage rate - fixed/floating]\n" +
                    "• Loan Tenure: [Duration in months/years]\n" +
                    "• EMI Amount: [Monthly installment amount if mentioned]\n" +
                    "• Processing Fee: [One-time charges]\n" +
                    "• Other Charges: [Documentation, legal, insurance, etc.]\n\n" +

                    "REPAYMENT TERMS:\n" +
                    "• EMI Start Date: [When payments begin]\n" +
                    "• EMI Due Date: [Monthly payment date]\n" +
                    "• Prepayment Terms: [Partial/full prepayment conditions]\n" +
                    "• Late Payment Penalty: [Charges for delayed payments]\n" +
                    "• Grace Period: [If any]\n\n" +

                    "---\n\n" +

                    "PHASE 2 - EMI CALCULATIONS & FINANCIAL BREAKDOWN:\n" +
                    "Based on the loan details extracted, calculate and provide:\n\n" +

                    "EMI CALCULATION FORMULA:\n" +
                    "• Show the EMI calculation using: EMI = [P × R × (1+R)^N] / [(1+R)^N - 1]\n" +
                    "• Where P = Principal, R = Monthly interest rate, N = Number of months\n\n" +

                    "MONTHLY EMI BREAKDOWN:\n" +
                    "• Monthly EMI Amount: ₹[calculated amount]\n" +
                    "• Principal Component (Month 1): ₹[amount going toward principal]\n" +
                    "• Interest Component (Month 1): ₹[amount going toward interest]\n" +
                    "• Outstanding Balance After Month 1: ₹[remaining amount]\n\n" +

                    "TOTAL PAYMENT ANALYSIS:\n" +
                    "• Total Amount Payable: ₹[EMI × Number of months]\n" +
                    "• Total Interest Payable: ₹[Total payable - Principal]\n" +
                    "• Interest as % of Principal: [Percentage]\n" +
                    "• Total Cost including all charges: ₹[Including processing fee and other charges]\n\n" +

                    "YEAR-WISE PAYMENT BREAKDOWN:\n" +
                    "For each year of the loan, provide:\n" +
                    "Year 1:\n" +
                    "• Total EMI Payments: ₹[12 × EMI or remaining months]\n" +
                    "• Principal Repaid: ₹[amount]\n" +
                    "• Interest Paid: ₹[amount]\n" +
                    "• Outstanding Balance at Year End: ₹[amount]\n" +
                    "[Repeat for each year until loan completion]\n\n" +

                    "---\n\n" +

                    "PHASE 3 - DETAILED MONTHLY PAYMENT SCHEDULE:\n" +
                    "Provide a month-by-month breakdown for at least the first 12 months:\n\n" +

                    "Month 1: EMI ₹[amount] | Principal ₹[amount] | Interest ₹[amount] | Balance ₹[amount]\n" +
                    "Month 2: EMI ₹[amount] | Principal ₹[amount] | Interest ₹[amount] | Balance ₹[amount]\n" +
                    "[Continue for first 12 months]\n\n" +

                    "MILESTONE PAYMENTS:\n" +
                    "• 25% of loan repaid by: Month [number] (₹[amount] paid)\n" +
                    "• 50% of loan repaid by: Month [number] (₹[amount] paid)\n" +
                    "• 75% of loan repaid by: Month [number] (₹[amount] paid)\n" +
                    "• 100% of loan repaid by: Month [number] (₹[amount] paid)\n\n" +

                    "---\n\n" +

                    "PHASE 4 - FINANCIAL IMPACT ANALYSIS:\n" +

                    "AFFORDABILITY ASSESSMENT:\n" +
                    "• Recommended Monthly Income: ₹[EMI should be max 40% of income]\n" +
                    "• Debt-to-Income Ratio: [If EMI is 40% of income]\n\n" +

                    "COST OPTIMIZATION SUGGESTIONS:\n" +
                    "• Prepayment Strategy: [How much to save on interest with prepayments]\n" +
                    "• If you prepay ₹[amount] annually: Total interest savings = ₹[amount]\n" +
                    "• If you prepay ₹[amount] in Year 5: Total interest savings = ₹[amount]\n\n" +

                    "RISK FACTORS:\n" +
                    "• Variable Interest Rate Risk: [If applicable]\n" +
                    "• Late Payment Impact: [Additional cost per delayed payment]\n" +
                    "• Prepayment Penalty: [Cost if you want to close loan early]\n\n" +

                    "COMPARISON WITH ALTERNATIVES:\n" +
                    "• If interest rate was 1% lower: Monthly savings = ₹[amount], Total savings = ₹[amount]\n" +
                    "• If tenure was 12 months shorter: Monthly EMI = ₹[amount], Total interest savings = ₹[amount]\n" +
                    "• If tenure was 12 months longer: Monthly EMI = ₹[amount], Additional interest cost = ₹[amount]\n\n" +

                    "---\n\n" +

                    "PHASE 5 - ACTION RECOMMENDATIONS:\n" +

                    "IMMEDIATE ACTIONS:\n" +
                    "• Set up auto-debit for EMI payments\n" +
                    "• Budget ₹[EMI amount + buffer] monthly for loan repayment\n" +
                    "• Review and understand all terms and conditions\n\n" +

                    "FINANCIAL PLANNING:\n" +
                    "• Emergency Fund: Keep ₹[3-6 months of EMI] as backup\n" +
                    "• Prepayment Strategy: [When and how much to prepay for maximum benefit]\n" +
                    "• Insurance: Ensure adequate life/health insurance to cover loan amount\n\n" +

                    "MONITORING:\n" +
                    "• Track payments and outstanding balance monthly\n" +
                    "• Review interest rate changes (if floating rate)\n" +
                    "• Consider refinancing if better rates become available\n\n" +

                    "Note: All calculations should be precise and based on standard EMI calculation formulas. If any loan details are missing from the document, clearly state what information is needed for complete analysis.";

            // Call the service to process the PDF
            JsonNode response = fileProcessingService.getResponse(pdfFile, loanAnalysisPrompt);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body("Error analyzing loan document: " + e.getMessage());
        }
    }



}
