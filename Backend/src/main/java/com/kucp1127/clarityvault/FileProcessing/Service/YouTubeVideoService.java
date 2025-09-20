package com.kucp1127.clarityvault.FileProcessing.Service;

import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import org.springframework.stereotype.Service;
import com.google.api.client.json.gson.GsonFactory;
import com.google.api.services.youtube.YouTube;
import com.google.api.services.youtube.model.SearchListResponse;
import com.google.api.services.youtube.model.SearchResult;
import org.springframework.beans.factory.annotation.Value;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.security.GeneralSecurityException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
// No longer need java.util.Arrays for this part

@Service
public class YouTubeVideoService {

    private static final Logger logger = LoggerFactory.getLogger(YouTubeVideoService.class);

    @Value("${youtube.api.key}")
    private String apiKey;

    private static final String APPLICATION_NAME = "YouTube Video Search";
    private static final GsonFactory JSON_FACTORY = GsonFactory.getDefaultInstance();

    public List<String> searchVideosByTitleAndLanguage(String title, String language) {
        List<String> videoLinks = new ArrayList<>();

        try {
            YouTube youtubeService = new YouTube.Builder(
                    GoogleNetHttpTransport.newTrustedTransport(),
                    JSON_FACTORY,
                    null
            ).setApplicationName(APPLICATION_NAME).build();

            YouTube.Search.List search = youtubeService.search().list(Collections.singletonList("snippet"));

            search.setKey(apiKey);
            search.setQ(title);

            search.setType(Collections.singletonList("video"));

            search.setMaxResults(2L);
            search.setRelevanceLanguage(language);
            search.setOrder("relevance");

            SearchListResponse searchResponse = search.execute();
            List<SearchResult> searchResultList = searchResponse.getItems();

            if (searchResultList != null) {
                for (SearchResult searchResult : searchResultList) {
                    String videoId = searchResult.getId().getVideoId();
                    String videoLink = "https://www.youtube.com/watch?v=" + videoId;
                    videoLinks.add(videoLink);
                }
            }

        } catch (GeneralSecurityException | IOException e) {
            logger.error("Error searching YouTube videos: {}", e.getMessage(), e);
            throw new RuntimeException("Error searching YouTube videos: " + e.getMessage());
        }

        return videoLinks;
    }
}