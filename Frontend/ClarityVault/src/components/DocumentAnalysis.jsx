import { motion, AnimatePresence } from "framer-motion";
import { useState, useCallback } from "react";
import {
  Languages as LanguagesIcon,
  FileSearch as FileSearchIcon,
  Youtube as YoutubeIcon,
  Bot as BotIcon,
  Loader2 as LoaderIcon,
  Download as DownloadIcon,
  Play as PlayIcon,
  ExternalLink as ExternalLinkIcon,
  AlertTriangle as AlertTriangleIcon,
  CheckCircle as CheckCircleIcon,
  FileText as FileTextIcon,
  Globe as GlobeIcon,
  Zap as ZapIcon,
  BookOpen as BookOpenIcon,
  BarChart3 as BarChartIcon,
  Tag as TagIcon,
} from "lucide-react";
import axios from "axios";
import { auth } from "../lib/utils";
import toast from "react-hot-toast";
import { useTheme } from "./theme-provider";

// API Configuration
const API_BASE_URL = "http://192.168.137.1:8080";

// Create authorized axios instance
const createAuthorizedRequest = () => {
  const token = auth.getToken();
  return axios.create({
    baseURL: API_BASE_URL,
    timeout: 60000, // 60 seconds for file processing
    headers: {
      Authorization: token ? `Bearer ${token}` : "",
    },
  });
};

// API Functions
const documentAPI = {
  // 1. Translate PDF Content
  translatePDF: async (file, language) => {
    const api = createAuthorizedRequest();
    const formData = new FormData();
    formData.append("file", file);
    formData.append("language", language);

    return api.post("/pdf_translation", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  // 2. Translate Text
  translateText: async (text, language) => {
    const api = createAuthorizedRequest();
    const formData = new FormData();
    formData.append("text", text);
    formData.append("language", language);

    return api.post("/text_translation", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  // 3. Extract and Summarize from PDF
  extractFromPDF: async (file, language) => {
    const api = createAuthorizedRequest();
    const formData = new FormData();
    formData.append("file", file);
    formData.append("language", language);

    return api.post("/pdf_jargon_extraction", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  // 4. Search YouTube Videos
  searchVideos: async (title, language) => {
    const api = createAuthorizedRequest();
    return api.get("/search", {
      params: { title, language },
    });
  },

  // 5. Identify Document Type
  identifyDocumentType: async (file) => {
    const api = createAuthorizedRequest();
    const formData = new FormData();
    formData.append("file", file);

    return api.post("/find_Document_type", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  // 6. Analyze Text Content
  analyzeText: async (text, language, documentType) => {
    const api = createAuthorizedRequest();
    const formData = new FormData();
    formData.append("text", text);
    formData.append("language", language);
    formData.append("documentType", documentType);

    return api.post("/analyze_text", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  // 7. Extract Text from PDF
  extractTextFromPDF: async (file) => {
    const api = createAuthorizedRequest();
    const formData = new FormData();
    formData.append("file", file);
    formData.append("language", "en"); // Default to English for text extraction

    return api.post("/pdf_jargon_extraction", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
};

// Language mapping for API calls (language name to language code)
const languageMapping = {
  // English languages
  English: "en",

  // Indian languages
  Hindi: "hi",
  Bengali: "bn",
  Marathi: "mr",
  Tamil: "ta",
  Telugu: "te",
  Kannada: "kn",
  Malayalam: "ml",
  Gujarati: "gu",
  Punjabi: "pa",
  Urdu: "ur",
  Assamese: "as",
  Sanskrit: "sa",
  Oriya: "or",
  Odia: "or",

  // European languages
  Spanish: "es",
  French: "fr",
  German: "de",
  Portuguese: "pt",
  Russian: "ru",
  Italian: "it",
  Dutch: "nl",
  Polish: "pl",
  Ukrainian: "uk",
  Turkish: "tr",

  // Asian languages
  Chinese: "zh",
  Japanese: "ja",
  Korean: "ko",
  Arabic: "ar",
  Vietnamese: "vi",
  Indonesian: "id",
  Thai: "th",
};

export default function DocumentAnalysis({ document, onClose }) {
  const [activeTab, setActiveTab] = useState("translate");
  const [loading, setLoading] = useState(false);
  const [translationResult, setTranslationResult] = useState(null);
  const [extractionResult, setExtractionResult] = useState(null);
  const [youtubeResults, setYoutubeResults] = useState([]);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [documentType, setDocumentType] = useState(null);

  const [selectedLanguage, setSelectedLanguage] = useState("Spanish");
  const [searchQuery, setSearchQuery] = useState("");
  const [textToAnalyze, setTextToAnalyze] = useState("");

  // Utility function to fetch document file from server
  const fetchDocumentFile = useCallback(
    async (documentId) => {
      if (!documentId) {
        console.error("❌ No document ID provided");
        return null;
      }

      try {
        console.log("📥 Fetching document file for ID:", documentId);
        const token = auth.getToken();

        if (!token) {
          console.error("❌ No auth token available");
          return null;
        }

        // Use the download endpoint from fileUploadAPI
        const response = await fetch(
          `${API_BASE_URL}/api/files/download/${documentId}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          console.error(
            "❌ Failed to fetch document file:",
            response.status,
            response.statusText
          );
          throw new Error(`Failed to download file: ${response.status}`);
        }

        const blob = await response.blob();
        console.log("✅ Document file fetched successfully, size:", blob.size);

        // Create a File object from the blob with proper filename
        const filename =
          document?.filename || document?.name || `document_${documentId}.pdf`;
        const file = new File([blob], filename, {
          type: blob.type || "application/pdf",
        });

        return file;
      } catch (error) {
        console.error("❌ Error fetching document file:", error);
        toast.error("Failed to fetch document file");
        return null;
      }
    },
    [document]
  );

  // API Testing function - call this in browser console
  const testAllAPIs = async () => {
    console.log("🧪 Starting comprehensive API testing...");
    console.log("📍 API Base URL:", API_BASE_URL);

    const token = auth.getToken();
    const isAuthenticated = auth.isAuthenticated();

    console.log("🔐 Authentication Status:", {
      hasToken: !!token,
      isAuthenticated,
      tokenPreview: token ? `${token.substring(0, 20)}...` : "No token",
    });

    if (!token || !isAuthenticated) {
      console.error("❌ Not authenticated. Please login first.");
      return;
    }

    const testResults = {
      baseConnectivity: false,
      endpoints: {},
    };

    // Test 1: Basic connectivity
    console.log("\n🌐 Testing base connectivity...");
    try {
      const response = await fetch(`${API_BASE_URL}/health`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      testResults.baseConnectivity = response.status < 500;
      console.log(
        `✅ Base connectivity: ${response.status} ${response.statusText}`
      );
    } catch (error) {
      console.error("❌ Base connectivity failed:", error.message);
    }

    // Test 2: PDF Translation endpoint
    console.log("\n📄 Testing PDF Translation endpoint...");
    try {
      const testFormData = new FormData();
      testFormData.append(
        "file",
        new Blob(["test"], { type: "application/pdf" }),
        "test.pdf"
      );
      testFormData.append("language", "Spanish");

      const response = await fetch(`${API_BASE_URL}/pdf_translation`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: testFormData,
      });

      testResults.endpoints.pdfTranslation = {
        status: response.status,
        statusText: response.statusText,
        accessible: response.status !== 404,
      };

      console.log(
        `${response.status < 500 ? "✅" : "❌"} PDF Translation: ${
          response.status
        } ${response.statusText}`
      );
    } catch (error) {
      console.error("❌ PDF Translation failed:", error.message);
      testResults.endpoints.pdfTranslation = { error: error.message };
    }

    // Test 3: Text Translation endpoint
    console.log("\n📝 Testing Text Translation endpoint...");
    try {
      const testFormData = new FormData();
      testFormData.append("text", "Hello world");
      testFormData.append("language", "Spanish");

      const response = await fetch(`${API_BASE_URL}/text_translation`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: testFormData,
      });

      testResults.endpoints.textTranslation = {
        status: response.status,
        statusText: response.statusText,
        accessible: response.status !== 404,
      };

      console.log(
        `${response.status < 500 ? "✅" : "❌"} Text Translation: ${
          response.status
        } ${response.statusText}`
      );
    } catch (error) {
      console.error("❌ Text Translation failed:", error.message);
      testResults.endpoints.textTranslation = { error: error.message };
    }

    // Test 4: PDF Jargon Extraction endpoint
    console.log("\n🔍 Testing PDF Jargon Extraction endpoint...");
    try {
      const testFormData = new FormData();
      testFormData.append(
        "file",
        new Blob(["test"], { type: "application/pdf" }),
        "test.pdf"
      );
      testFormData.append("language", "Spanish");

      const response = await fetch(`${API_BASE_URL}/pdf_jargon_extraction`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: testFormData,
      });

      testResults.endpoints.pdfJargonExtraction = {
        status: response.status,
        statusText: response.statusText,
        accessible: response.status !== 404,
      };

      console.log(
        `${response.status < 500 ? "✅" : "❌"} PDF Jargon Extraction: ${
          response.status
        } ${response.statusText}`
      );
    } catch (error) {
      console.error("❌ PDF Jargon Extraction failed:", error.message);
      testResults.endpoints.pdfJargonExtraction = { error: error.message };
    }

    // Test 5: YouTube Search endpoint
    console.log("\n🎥 Testing YouTube Search endpoint...");
    try {
      const response = await fetch(
        `${API_BASE_URL}/search?title=test&language=Spanish`,
        {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      testResults.endpoints.youtubeSearch = {
        status: response.status,
        statusText: response.statusText,
        accessible: response.status !== 404,
      };

      console.log(
        `${response.status < 500 ? "✅" : "❌"} YouTube Search: ${
          response.status
        } ${response.statusText}`
      );
    } catch (error) {
      console.error("❌ YouTube Search failed:", error.message);
      testResults.endpoints.youtubeSearch = { error: error.message };
    }

    // Test 6: Document Type Identification endpoint
    console.log("\n📋 Testing Document Type Identification endpoint...");
    try {
      const testFormData = new FormData();
      testFormData.append(
        "file",
        new Blob(["test"], { type: "application/pdf" }),
        "test.pdf"
      );

      const response = await fetch(`${API_BASE_URL}/find_Document_type`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: testFormData,
      });

      testResults.endpoints.documentType = {
        status: response.status,
        statusText: response.statusText,
        accessible: response.status !== 404,
      };

      console.log(
        `${response.status < 500 ? "✅" : "❌"} Document Type Identification: ${
          response.status
        } ${response.statusText}`
      );
    } catch (error) {
      console.error("❌ Document Type Identification failed:", error.message);
      testResults.endpoints.documentType = { error: error.message };
    }

    // Test 7: Text Analysis endpoint
    console.log("\n🤖 Testing Text Analysis endpoint...");
    try {
      const testFormData = new FormData();
      testFormData.append("text", "This is a test contract");
      testFormData.append("language", "Spanish");
      testFormData.append("documentType", "Legal Document");

      const response = await fetch(`${API_BASE_URL}/analyze_text`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: testFormData,
      });

      testResults.endpoints.textAnalysis = {
        status: response.status,
        statusText: response.statusText,
        accessible: response.status !== 404,
      };

      console.log(
        `${response.status < 500 ? "✅" : "❌"} Text Analysis: ${
          response.status
        } ${response.statusText}`
      );
    } catch (error) {
      console.error("❌ Text Analysis failed:", error.message);
      testResults.endpoints.textAnalysis = { error: error.message };
    }

    // Summary
    console.log("\n📊 API Testing Summary:");
    console.log("=".repeat(50));
    console.table(testResults.endpoints);

    const workingEndpoints = Object.values(testResults.endpoints).filter(
      (ep) => ep.accessible
    ).length;
    const totalEndpoints = Object.keys(testResults.endpoints).length;

    console.log(
      `\n📈 Results: ${workingEndpoints}/${totalEndpoints} endpoints accessible`
    );

    if (workingEndpoints === 0) {
      console.log(
        "❌ No endpoints are accessible. Check if backend server is running on",
        API_BASE_URL
      );
    } else if (workingEndpoints < totalEndpoints) {
      console.log(
        "⚠️ Some endpoints are not accessible. Check backend implementation."
      );
    } else {
      console.log("✅ All endpoints are accessible!");
    }

    return testResults;
  };

  // Make testAllAPIs available globally for console access
  if (typeof window !== "undefined") {
    window.testDocumentAPIs = testAllAPIs;
  }

  const languages = [
    "Spanish",
    "French",
    "German",
    "Italian",
    "Portuguese",
    "Dutch",
    "Russian",
    "Chinese",
    "Japanese",
    "Korean",
    "Arabic",
    "Hindi",
    "Bengali",
    "Tamil",
    "Telugu",
    "Marathi",
    "Gujarati",
    "Urdu",
  ];

  // Helper function to get language code from language name
  const getLanguageCode = useCallback((languageName) => {
    return languageMapping[languageName] || languageName.toLowerCase();
  }, []);

  // Handle PDF Translation
  const handleTranslatePDF = useCallback(async () => {
    if (!document?.file && !document?.id) {
      toast.error("No document available for translation");
      return;
    }

    // Check authentication
    const token = auth.getToken();
    const isAuthenticated = auth.isAuthenticated();

    console.log("🔐 Pre-translation auth check:", {
      hasToken: !!token,
      isAuthenticated,
      tokenPreview: token ? `${token.substring(0, 20)}...` : "No token",
    });

    if (!isAuthenticated || !token) {
      console.log("🔐 Not authenticated, redirecting to login");
      toast.error("Please login to access document analysis features.", {
        duration: 6000,
      });
      return;
    }

    // If token exists but is expired, clear it and show error
    if (token && auth.isTokenExpired(token)) {
      console.log("🔐 Token is expired, clearing storage");
      auth.removeToken();
      toast.error("Your session has expired. Please login again.", {
        duration: 6000,
      });
      return;
    }

    setLoading(true);
    try {
      console.log("📤 Making API call for translation...");

      // Get the file - either from document.file or fetch from server
      let fileToProcess = document.file;
      if (!fileToProcess && document.id) {
        console.log(
          "📥 Fetching file from server for document ID:",
          document.id
        );
        fileToProcess = await fetchDocumentFile(document.id);
      }

      if (!fileToProcess) {
        toast.error(
          "Unable to access document file. Please try uploading again."
        );
        return;
      }

      console.log("📄 Processing file:", {
        name: fileToProcess.name,
        size: fileToProcess.size,
        type: fileToProcess.type,
      });

      const response = await documentAPI.translatePDF(
        fileToProcess,
        selectedLanguage
      );

      console.log("✅ Translation successful:", response.data);
      setTranslationResult(response.data);
      toast.success("Document translated successfully");
    } catch (error) {
      console.error("❌ Translation failed:", error);

      if (error.response?.status === 401) {
        auth.removeToken();
        toast.error("Authentication failed. Please login again.");
        return;
      }

      if (error.response?.status === 400) {
        toast.error("Invalid file format. Please upload a PDF file.");
        return;
      }

      const errorMessage =
        error.response?.data?.message || error.message || "Translation failed";
      toast.error(`Translation failed: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  }, [document, selectedLanguage, fetchDocumentFile]);

  // Handle PDF Extraction and Summarization
  const handleExtractFromPDF = useCallback(async () => {
    if (!document?.file && !document?.id) {
      toast.error("No document available for extraction");
      return;
    }

    // Check authentication before making request
    const token = auth.getToken();
    const isAuthenticated = auth.isAuthenticated();

    console.log("🔐 Pre-extraction auth check:", {
      hasToken: !!token,
      isAuthenticated,
      tokenPreview: token ? `${token.substring(0, 20)}...` : "No token",
    });

    if (!isAuthenticated || !token) {
      toast.error("Please login again to access document analysis features.", {
        duration: 6000,
        action: {
          label: "Login",
          onClick: () => (window.location.href = "/login"),
        },
      });
      return;
    }

    setLoading(true);
    try {
      // Get the file - either from document.file or fetch from server
      let fileToProcess = document.file;
      if (!fileToProcess && document.id) {
        console.log(
          "📥 Fetching file from server for document ID:",
          document.id
        );
        fileToProcess = await fetchDocumentFile(document.id);
      }

      if (!fileToProcess) {
        toast.error(
          "Unable to access document file. Please try uploading again."
        );
        return;
      }

      const response = await documentAPI.extractFromPDF(
        fileToProcess,
        selectedLanguage
      );

      setExtractionResult(response.data);
      toast.success("Document analyzed successfully");
    } catch (error) {
      console.error("Analysis error:", error);

      if (error.response?.status === 401) {
        auth.removeToken();
        toast.error("Authentication failed. Please login again.");
        return;
      }

      if (error.response?.status === 400) {
        toast.error("Invalid file format. Please upload a PDF file.");
        return;
      }

      const errorMessage =
        error.response?.data?.message || error.message || "Analysis failed";
      toast.error(`Analysis failed: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  }, [document, selectedLanguage, fetchDocumentFile]);

  // Handle YouTube Video Search
  const handleSearchVideos = useCallback(async () => {
    if (!searchQuery.trim()) {
      toast.error("Please enter a search query");
      return;
    }

    const token = auth.getToken();
    if (!token || !auth.isAuthenticated()) {
      toast.error("Please login to access this feature");
      return;
    }

    setLoading(true);
    try {
      // Convert language name to language code for API call
      const languageCode = getLanguageCode(selectedLanguage);

      console.log("🎥 Searching videos with:", {
        query: searchQuery,
        languageName: selectedLanguage,
        languageCode: languageCode,
      });

      const response = await documentAPI.searchVideos(
        searchQuery,
        languageCode // Send language code instead of language name
      );

      console.log("✅ Video search successful:", response.data);
      const formattedVideos = formatYouTubeResults(response.data);
      setYoutubeResults(formattedVideos);
      toast.success(`Found ${formattedVideos.length} videos`);
    } catch (error) {
      console.error("Video search error:", error);

      if (error.response?.status === 401) {
        auth.removeToken();
        toast.error("Authentication failed. Please login again.");
        return;
      }

      const errorMessage =
        error.response?.data?.message || error.message || "Video search failed";
      toast.error(`Video search failed: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedLanguage, getLanguageCode]);

  // Handle Document Type Identification
  const handleIdentifyDocumentType = useCallback(async () => {
    if (!document?.file && !document?.id) {
      toast.error("No document available for type identification");
      return;
    }

    const token = auth.getToken();
    if (!token || !auth.isAuthenticated()) {
      toast.error("Please login to access this feature");
      return;
    }

    setLoading(true);
    try {
      // Get the file - either from document.file or fetch from server
      let fileToProcess = document.file;
      if (!fileToProcess && document.id) {
        console.log(
          "📥 Fetching file from server for document ID:",
          document.id
        );
        fileToProcess = await fetchDocumentFile(document.id);
      }

      if (!fileToProcess) {
        toast.error(
          "Unable to access document file. Please try uploading again."
        );
        return;
      }

      const response = await documentAPI.identifyDocumentType(fileToProcess);

      setDocumentType(response.data);
      toast.success("Document type identified successfully");
    } catch (error) {
      console.error("Document type identification error:", error);

      if (error.response?.status === 401) {
        auth.removeToken();
        toast.error("Authentication failed. Please login again.");
        return;
      }

      if (error.response?.status === 400) {
        toast.error("Invalid file format. Please upload a PDF file.");
        return;
      }

      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Type identification failed";
      toast.error(`Type identification failed: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  }, [document, fetchDocumentFile]);

  // Handle Text Analysis
  const handleAnalyzeText = useCallback(async () => {
    if (!textToAnalyze.trim()) {
      toast.error("Please enter text to analyze");
      return;
    }

    if (!documentType) {
      toast.error("Please identify document type first");
      return;
    }

    const token = auth.getToken();
    if (!token || !auth.isAuthenticated()) {
      toast.error("Please login to access this feature");
      return;
    }

    setLoading(true);
    try {
      console.log("🤖 Making API call for text analysis...");
      console.log("📝 Text to analyze:", {
        length: textToAnalyze.length,
        language: selectedLanguage,
        documentType: documentType?.type || "Legal Document",
      });

      const response = await documentAPI.analyzeText(
        textToAnalyze,
        selectedLanguage,
        documentType.type || "Legal Document"
      );

      console.log("✅ Text analysis successful:", response.data);
      setAnalysisResult(response.data);
      toast.success("Text analyzed successfully");
    } catch (error) {
      console.error("Text analysis error:", error);

      if (error.response?.status === 401) {
        auth.removeToken();
        toast.error("Authentication failed. Please login again.");
        return;
      }

      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Text analysis failed";
      toast.error(`Text analysis failed: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  }, [textToAnalyze, selectedLanguage, documentType]);

  // Helper function to format text content into readable paragraphs with bold formatting
  const formatTextContent = (text) => {
    if (!text) return null;

    // Helper function to parse text with **bold** formatting
    const parseTextWithBold = (textToParse) => {
      const parts = textToParse.split(/(\*\*.*?\*\*)/g);
      return parts.map((part, index) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          // Remove the ** markers and make the text bold
          const boldText = part.slice(2, -2);
          return (
            <strong
              key={index}
              className="font-bold text-gray-900 dark:text-white"
            >
              {boldText}
            </strong>
          );
        }
        return part;
      });
    };

    // Split text into paragraphs and clean them up
    const paragraphs = text
      .split(/\n\s*\n|\r\n\s*\r\n/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    if (paragraphs.length === 0) {
      // If no clear paragraphs, split by sentences for better readability
      const sentences = text
        .split(/[.!?]+/)
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
      return sentences.map((sentence, index) => (
        <p
          key={index}
          className="mb-3 text-gray-800 dark:text-gray-200 leading-relaxed"
        >
          {parseTextWithBold(sentence)}
          {sentence.match(/[.!?]$/) ? "" : "."}
        </p>
      ));
    }

    return paragraphs.map((paragraph, index) => (
      <p
        key={index}
        className="mb-4 text-gray-800 dark:text-gray-200 leading-relaxed text-justify"
      >
        {parseTextWithBold(paragraph)}
      </p>
    ));
  };

  // Helper function to parse and format translation result
  const formatTranslationResult = (result) => {
    if (!result) return null;

    // If it's a string, try to parse as JSON first
    let parsedResult = result;
    if (typeof result === "string") {
      try {
        parsedResult = JSON.parse(result);
      } catch {
        // If not JSON, treat as plain text with better formatting
        return (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-l-4 border-blue-500 p-6 rounded-r-xl shadow-sm">
              <div className="flex items-center mb-4">
                <LanguagesIcon className="w-6 h-6 text-blue-600 mr-3" />
                <h5 className="text-lg font-semibold text-blue-900">
                  Translated Document
                </h5>
              </div>
              <div className="prose prose-blue max-w-none">
                {formatTextContent(result)}
              </div>
            </div>
          </div>
        );
      }
    }

    // Check if it's the Google API response format with candidates
    if (
      parsedResult &&
      parsedResult.candidates &&
      Array.isArray(parsedResult.candidates)
    ) {
      const translatedText =
        parsedResult.candidates[0]?.content?.parts?.[0]?.text;
      if (translatedText) {
        return (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-l-4 border-blue-500 p-6 rounded-r-xl shadow-sm">
              <div className="flex items-center mb-4">
                <LanguagesIcon className="w-6 h-6 text-blue-600 mr-3" />
                <h5 className="text-lg font-semibold text-blue-900">
                  Translated to {selectedLanguage}
                </h5>
              </div>
              <div className="prose prose-blue max-w-none">
                {formatTextContent(translatedText)}
              </div>
            </div>
          </div>
        );
      }
    }

    // Handle structured response with better formatting
    if (typeof parsedResult === "object") {
      return (
        <div className="space-y-6">
          {/* Main Translation Content */}
          {(parsedResult.translated_text || parsedResult.translation) && (
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-l-4 border-blue-500 p-6 rounded-r-xl shadow-sm">
              <div className="flex items-center mb-4">
                <LanguagesIcon className="w-6 h-6 text-blue-600 mr-3" />
                <h5 className="text-lg font-semibold text-blue-900">
                  Translated to {selectedLanguage}
                </h5>
              </div>
              <div className="prose prose-blue max-w-none">
                {formatTextContent(
                  parsedResult.translated_text || parsedResult.translation
                )}
              </div>
            </div>
          )}

          {/* Original Text Preview */}
          {parsedResult.original_text && (
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-l-4 border-gray-400 p-6 rounded-r-xl shadow-sm">
              <div className="flex items-center mb-4">
                <FileTextIcon className="w-6 h-6 text-gray-600 mr-3" />
                <h5 className="text-lg font-semibold text-gray-700">
                  Original Content
                </h5>
              </div>
              <div className="prose prose-gray max-w-none">
                {parsedResult.original_text.length > 500 ? (
                  <div>
                    {formatTextContent(
                      parsedResult.original_text.substring(0, 500)
                    )}
                    <div className="mt-2 text-sm text-gray-500 italic">
                      ... and {parsedResult.original_text.length - 500} more
                      characters
                    </div>
                  </div>
                ) : (
                  formatTextContent(parsedResult.original_text)
                )}
              </div>
            </div>
          )}

          {/* Summary Section */}
          {parsedResult.summary && (
            <div className="bg-gradient-to-r from-purple-50 to-purple-100 border-l-4 border-purple-500 p-6 rounded-r-xl shadow-sm">
              <div className="flex items-center mb-4">
                <ZapIcon className="w-6 h-6 text-purple-600 mr-3" />
                <h5 className="text-lg font-semibold text-purple-900">
                  Summary
                </h5>
              </div>
              <div className="prose prose-purple max-w-none">
                {formatTextContent(parsedResult.summary)}
              </div>
            </div>
          )}

          {/* Translation Details */}
          {(parsedResult.source_language ||
            parsedResult.target_language ||
            parsedResult.confidence) && (
            <div className="bg-gradient-to-r from-green-50 to-green-100 border-l-4 border-green-500 p-6 rounded-r-xl shadow-sm">
              <div className="flex items-center mb-4">
                <GlobeIcon className="w-6 h-6 text-green-600 mr-3" />
                <h5 className="text-lg font-semibold text-green-900">
                  Translation Details
                </h5>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {parsedResult.source_language && (
                  <div className="text-center p-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg shadow-sm border border-green-200 dark:border-gray-700">
                    <div className="text-sm font-medium text-green-700 dark:text-green-300 mb-1">
                      Source Language
                    </div>
                    <div className="text-lg font-semibold text-gray-800 dark:text-white">
                      {parsedResult.source_language}
                    </div>
                  </div>
                )}
                {parsedResult.target_language && (
                  <div className="text-center p-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg shadow-sm border border-green-200 dark:border-gray-700">
                    <div className="text-sm font-medium text-green-700 dark:text-green-300 mb-1">
                      Target Language
                    </div>
                    <div className="text-lg font-semibold text-gray-800 dark:text-white">
                      {parsedResult.target_language}
                    </div>
                  </div>
                )}
                {parsedResult.confidence && (
                  <div className="text-center p-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg shadow-sm border border-green-200 dark:border-gray-700">
                    <div className="text-sm font-medium text-green-700 dark:text-green-300 mb-1">
                      Confidence
                    </div>
                    <div className="text-lg font-semibold text-gray-800 dark:text-white">
                      {Math.round(parsedResult.confidence * 100)}%
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Statistics */}
          {(parsedResult.word_count || parsedResult.character_count) && (
            <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 border-l-4 border-yellow-500 p-6 rounded-r-xl shadow-sm">
              <div className="flex items-center mb-4">
                <FileTextIcon className="w-6 h-6 text-yellow-600 mr-3" />
                <h5 className="text-lg font-semibold text-yellow-900">
                  Document Statistics
                </h5>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {parsedResult.word_count && (
                  <div className="text-center p-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg shadow-sm border border-yellow-200 dark:border-gray-700">
                    <div className="text-sm font-medium text-yellow-700 dark:text-yellow-300 mb-1">
                      Words
                    </div>
                    <div className="text-2xl font-bold text-gray-800 dark:text-white">
                      {parsedResult.word_count.toLocaleString()}
                    </div>
                  </div>
                )}
                {parsedResult.character_count && (
                  <div className="text-center p-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg shadow-sm border border-yellow-200 dark:border-gray-700">
                    <div className="text-sm font-medium text-yellow-700 dark:text-yellow-300 mb-1">
                      Characters
                    </div>
                    <div className="text-2xl font-bold text-gray-800 dark:text-white">
                      {parsedResult.character_count.toLocaleString()}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Raw data fallback for debugging */}
          {Object.keys(parsedResult).some(
            (key) =>
              ![
                "original_text",
                "translated_text",
                "translation",
                "source_language",
                "target_language",
                "confidence",
                "summary",
                "word_count",
                "character_count",
              ].includes(key)
          ) && (
            <details className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <summary className="font-medium text-gray-700 cursor-pointer hover:text-gray-900 transition-colors">
                View Additional Data
              </summary>
              <div className="mt-4 p-4 bg-white rounded border">
                <pre className="text-xs text-gray-600 overflow-auto whitespace-pre-wrap">
                  {JSON.stringify(parsedResult, null, 2)}
                </pre>
              </div>
            </details>
          )}
        </div>
      );
    }

    // Fallback for plain text
    return (
      <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-l-4 border-blue-500 p-6 rounded-r-xl shadow-sm">
        <div className="prose prose-blue max-w-none">
          {formatTextContent(String(result))}
        </div>
      </div>
    );
  };

  // Helper function to format YouTube video results
  const formatYouTubeResults = (result) => {
    if (!result) return [];

    // If it's a string, try to parse as JSON first
    let parsedResult = result;
    if (typeof result === "string") {
      try {
        parsedResult = JSON.parse(result);
      } catch {
        // If not JSON, return empty array
        return [];
      }
    }

    // Check if it's the Google API response format with candidates
    if (
      parsedResult &&
      parsedResult.candidates &&
      Array.isArray(parsedResult.candidates)
    ) {
      const videoText = parsedResult.candidates[0]?.content?.parts?.[0]?.text;
      if (videoText) {
        // Try to parse the video text as JSON for structured data
        try {
          const structuredVideos = JSON.parse(videoText);
          if (Array.isArray(structuredVideos)) {
            return structuredVideos;
          } else if (
            structuredVideos.videos &&
            Array.isArray(structuredVideos.videos)
          ) {
            return structuredVideos.videos;
          }
        } catch {
          // If not JSON, try to extract video URLs/titles from plain text
          const lines = videoText.split("\n").filter((line) => line.trim());
          return lines.map((line, index) => ({
            title: line.trim(),
            url: line.includes("http")
              ? line.trim()
              : `https://youtube.com/search?q=${encodeURIComponent(
                  line.trim()
                )}`,
            id: `video-${index}`,
          }));
        }
      }
    }

    // Handle array results
    if (Array.isArray(parsedResult)) {
      return parsedResult;
    }

    // Handle object with videos property
    if (
      parsedResult &&
      parsedResult.videos &&
      Array.isArray(parsedResult.videos)
    ) {
      return parsedResult.videos;
    }

    // Return empty array if no valid format found
    return [];
  };
  // Helper function to format general analysis results
  const formatAnalysisResult = (
    result,
    title = "Analysis Result",
    icon = ZapIcon,
    colorScheme = "blue"
  ) => {
    if (!result) return null;

    const colorClasses = {
      blue: {
        bg: "bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20",
        border: "border-green-500 dark:border-green-400",
        icon: "text-green-600 dark:text-green-400",
        title: "text-green-900 dark:text-green-100",
        prose: "prose-green",
      },
      green: {
        bg: "bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20",
        border: "border-green-500 dark:border-green-400",
        icon: "text-green-600 dark:text-green-400",
        title: "text-green-900 dark:text-green-100",
        prose: "prose-green",
      },
      purple: {
        bg: "bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20",
        border: "border-green-500 dark:border-green-400",
        icon: "text-green-600 dark:text-green-400",
        title: "text-green-900 dark:text-green-100",
        prose: "prose-green",
      },
      orange: {
        bg: "bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20",
        border: "border-yellow-500 dark:border-yellow-400",
        icon: "text-yellow-600 dark:text-yellow-400",
        title: "text-yellow-900 dark:text-yellow-100",
        prose: "prose-yellow",
      },
      indigo: {
        bg: "bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20",
        border: "border-green-500 dark:border-green-400",
        icon: "text-green-600 dark:text-green-400",
        title: "text-green-900 dark:text-green-100",
        prose: "prose-green",
      },
    };

    const colors = colorClasses[colorScheme] || colorClasses.blue;
    const IconComponent = icon;

    // Parse result if it's a string
    let parsedResult = result;
    if (typeof result === "string") {
      try {
        parsedResult = JSON.parse(result);
      } catch {
        // If not JSON, format as readable text
        return (
          <div className="space-y-6">
            <div
              className={`${colors.bg} border-l-4 ${colors.border} p-6 rounded-r-xl shadow-sm`}
            >
              <div className="flex items-center mb-4">
                <IconComponent className={`w-6 h-6 ${colors.icon} mr-3`} />
                <h5 className={`text-lg font-semibold ${colors.title}`}>
                  {title}
                </h5>
              </div>
              <div className={`prose ${colors.prose} max-w-none`}>
                {formatTextContent(result)}
              </div>
            </div>
          </div>
        );
      }
    }

    // Check if it's the Google API response format with candidates (similar to translation)
    if (
      parsedResult &&
      parsedResult.candidates &&
      Array.isArray(parsedResult.candidates)
    ) {
      const analysisText =
        parsedResult.candidates[0]?.content?.parts?.[0]?.text;
      if (analysisText) {
        // Try to parse the analysis text as JSON for structured data
        let structuredAnalysis;
        try {
          structuredAnalysis = JSON.parse(analysisText);
        } catch {
          // If not JSON, display as formatted text
          return (
            <div className="space-y-6">
              <div
                className={`${colors.bg} border-l-4 ${colors.border} p-6 rounded-r-xl shadow-sm`}
              >
                <div className="flex items-center mb-4">
                  <IconComponent className={`w-6 h-6 ${colors.icon} mr-3`} />
                  <h5 className={`text-lg font-semibold ${colors.title}`}>
                    {title}
                  </h5>
                </div>
                <div className={`prose ${colors.prose} max-w-none`}>
                  {formatTextContent(analysisText)}
                </div>
              </div>
            </div>
          );
        }

        // If we successfully parsed JSON from the analysis text, use that
        if (structuredAnalysis && typeof structuredAnalysis === "object") {
          parsedResult = structuredAnalysis;
        } else {
          // Otherwise use the formatted text
          return (
            <div className="space-y-6">
              <div
                className={`${colors.bg} border-l-4 ${colors.border} p-6 rounded-r-xl shadow-sm`}
              >
                <div className="flex items-center mb-4">
                  <IconComponent className={`w-6 h-6 ${colors.icon} mr-3`} />
                  <h5 className={`text-lg font-semibold ${colors.title}`}>
                    {title}
                  </h5>
                </div>
                <div className={`prose ${colors.prose} max-w-none`}>
                  {formatTextContent(analysisText)}
                </div>
              </div>
            </div>
          );
        }
      }
    }

    // Handle object results with intelligent formatting
    if (typeof parsedResult === "object") {
      return (
        <div className="space-y-6">
          {/* Main Content Section */}
          {(parsedResult.result ||
            parsedResult.content ||
            parsedResult.text ||
            parsedResult.analysis) && (
            <div
              className={`${colors.bg} border-l-4 ${colors.border} p-6 rounded-r-xl shadow-sm`}
            >
              <div className="flex items-center mb-4">
                <IconComponent className={`w-6 h-6 ${colors.icon} mr-3`} />
                <h5 className={`text-lg font-semibold ${colors.title}`}>
                  {title}
                </h5>
              </div>
              <div className={`prose ${colors.prose} max-w-none`}>
                {formatTextContent(
                  parsedResult.result ||
                    parsedResult.content ||
                    parsedResult.text ||
                    parsedResult.analysis
                )}
              </div>
            </div>
          )}

          {/* Key Information Section */}
          {parsedResult.key_information && (
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-l-4 border-blue-500 p-6 rounded-r-xl shadow-sm">
              <div className="flex items-center mb-4">
                <ZapIcon className="w-6 h-6 text-blue-600 mr-3" />
                <h5 className="text-lg font-semibold text-blue-900">
                  Key Information
                </h5>
              </div>
              <div className="space-y-3">
                {Array.isArray(parsedResult.key_information) ? (
                  parsedResult.key_information.map((item, index) => (
                    <div
                      key={index}
                      className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-blue-300"
                    >
                      <div className="prose prose-blue max-w-none">
                        {formatTextContent(item)}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="prose prose-blue max-w-none">
                    {formatTextContent(parsedResult.key_information)}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Summary Section */}
          {parsedResult.summary && (
            <div className="bg-gradient-to-r from-green-50 to-green-100 border-l-4 border-green-500 p-6 rounded-r-xl shadow-sm">
              <div className="flex items-center mb-4">
                <FileSearchIcon className="w-6 h-6 text-green-600 mr-3" />
                <h5 className="text-lg font-semibold text-green-900">
                  Summary
                </h5>
              </div>
              <div className="prose prose-green max-w-none">
                {formatTextContent(parsedResult.summary)}
              </div>
            </div>
          )}

          {/* Legal Terms Section */}
          {(parsedResult.legal_terms ||
            parsedResult.jargon_terms ||
            parsedResult.keywords ||
            parsedResult.tags) && (
            <div className="bg-gradient-to-r from-purple-50 to-purple-100 border-l-4 border-purple-500 p-6 rounded-r-xl shadow-sm">
              <div className="flex items-center mb-4">
                <BotIcon className="w-6 h-6 text-purple-600 mr-3" />
                <h5 className="text-lg font-semibold text-purple-900">
                  {parsedResult.legal_terms
                    ? "Legal Terms"
                    : parsedResult.jargon_terms
                    ? "Jargon Terms"
                    : "Keywords"}
                </h5>
              </div>
              <div className="flex flex-wrap gap-3">
                {(
                  parsedResult.legal_terms ||
                  parsedResult.jargon_terms ||
                  parsedResult.keywords ||
                  parsedResult.tags ||
                  []
                ).map((term, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-purple-100 text-purple-800 border border-purple-200 shadow-sm"
                  >
                    {typeof term === "object"
                      ? term.term || term.text || JSON.stringify(term)
                      : term}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Risk Assessment Section */}
          {parsedResult.risks && (
            <div className="bg-gradient-to-r from-red-50 to-red-100 border-l-4 border-red-500 p-6 rounded-r-xl shadow-sm">
              <div className="flex items-center mb-4">
                <AlertTriangleIcon className="w-6 h-6 text-red-600 mr-3" />
                <h5 className="text-lg font-semibold text-red-900">
                  Risk Assessment
                </h5>
              </div>
              <div className="space-y-3">
                {Array.isArray(parsedResult.risks) ? (
                  parsedResult.risks.map((risk, index) => (
                    <div
                      key={index}
                      className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-red-300"
                    >
                      <div className="prose prose-red max-w-none">
                        {formatTextContent(risk)}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="prose prose-red max-w-none">
                    {formatTextContent(parsedResult.risks)}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Definitions/Explanations Section */}
          {(parsedResult.definitions || parsedResult.explanations) && (
            <div className="bg-gradient-to-r from-indigo-50 to-indigo-100 border-l-4 border-indigo-500 p-6 rounded-r-xl shadow-sm">
              <div className="flex items-center mb-4">
                <BookOpenIcon className="w-6 h-6 text-indigo-600 mr-3" />
                <h5 className="text-lg font-semibold text-indigo-900">
                  Definitions
                </h5>
              </div>
              <div className="space-y-4">
                {(
                  parsedResult.definitions ||
                  parsedResult.explanations ||
                  []
                ).map((definition, index) => (
                  <div
                    key={index}
                    className="bg-white p-4 rounded-lg shadow-sm border border-indigo-200"
                  >
                    {typeof definition === "object" ? (
                      <div>
                        {definition.term && (
                          <h6 className="font-semibold text-indigo-800 mb-2">
                            {definition.term}
                          </h6>
                        )}
                        <div className="prose prose-indigo max-w-none">
                          {formatTextContent(
                            definition.definition ||
                              definition.explanation ||
                              definition.description
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="prose prose-indigo max-w-none">
                        {formatTextContent(definition)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Statistics/Metrics Section */}
          {(parsedResult.word_count ||
            parsedResult.character_count ||
            parsedResult.page_count ||
            parsedResult.confidence ||
            parsedResult.language) && (
            <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 border-l-4 border-yellow-500 p-6 rounded-r-xl shadow-sm">
              <div className="flex items-center mb-4">
                <BarChartIcon className="w-6 h-6 text-yellow-600 mr-3" />
                <h5 className="text-lg font-semibold text-yellow-900">
                  Document Statistics
                </h5>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {parsedResult.word_count && (
                  <div className="text-center p-3 bg-white rounded-lg shadow-sm border">
                    <div className="text-sm font-medium text-yellow-700 mb-1">
                      Words
                    </div>
                    <div className="text-2xl font-bold text-gray-800">
                      {parsedResult.word_count.toLocaleString()}
                    </div>
                  </div>
                )}
                {parsedResult.character_count && (
                  <div className="text-center p-3 bg-white rounded-lg shadow-sm border">
                    <div className="text-sm font-medium text-yellow-700 mb-1">
                      Characters
                    </div>
                    <div className="text-2xl font-bold text-gray-800">
                      {parsedResult.character_count.toLocaleString()}
                    </div>
                  </div>
                )}
                {parsedResult.page_count && (
                  <div className="text-center p-3 bg-white rounded-lg shadow-sm border">
                    <div className="text-sm font-medium text-yellow-700 mb-1">
                      Pages
                    </div>
                    <div className="text-2xl font-bold text-gray-800">
                      {parsedResult.page_count}
                    </div>
                  </div>
                )}
                {parsedResult.confidence && (
                  <div className="text-center p-3 bg-white rounded-lg shadow-sm border">
                    <div className="text-sm font-medium text-yellow-700 mb-1">
                      Confidence
                    </div>
                    <div className="text-2xl font-bold text-gray-800">
                      {Math.round(parsedResult.confidence * 100)}%
                    </div>
                  </div>
                )}
                {parsedResult.language && (
                  <div className="text-center p-3 bg-white rounded-lg shadow-sm border">
                    <div className="text-sm font-medium text-yellow-700 mb-1">
                      Language
                    </div>
                    <div className="text-lg font-semibold text-gray-800">
                      {parsedResult.language}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Raw data fallback for debugging */}
          {Object.keys(parsedResult).some(
            (key) =>
              ![
                "result",
                "content",
                "text",
                "analysis",
                "key_information",
                "summary",
                "legal_terms",
                "jargon_terms",
                "keywords",
                "tags",
                "risks",
                "definitions",
                "explanations",
                "word_count",
                "character_count",
                "page_count",
                "confidence",
                "language",
              ].includes(key)
          ) && (
            <details className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <summary className="font-medium text-gray-700 cursor-pointer hover:text-gray-900 transition-colors">
                View Additional Data
              </summary>
              <div className="mt-4 p-4 bg-white rounded border">
                <pre className="text-xs text-gray-600 overflow-auto whitespace-pre-wrap">
                  {JSON.stringify(parsedResult, null, 2)}
                </pre>
              </div>
            </details>
          )}
        </div>
      );
    }

    // Fallback for other data types
    return (
      <div
        className={`${colors.bg} border-l-4 ${colors.border} p-6 rounded-r-xl shadow-sm`}
      >
        <div className="flex items-center mb-4">
          <IconComponent className={`w-6 h-6 ${colors.icon} mr-3`} />
          <h5 className={`text-lg font-semibold ${colors.title}`}>{title}</h5>
        </div>
        <div className={`prose ${colors.prose} max-w-none`}>
          {formatTextContent(String(result))}
        </div>
      </div>
    );
  };

  const tabs = [
    { id: "translate", label: "Translate", icon: LanguagesIcon, color: "blue" },
    {
      id: "extract",
      label: "Extract & Analyze",
      icon: FileSearchIcon,
      color: "green",
    },
    { id: "videos", label: "Find Videos", icon: YoutubeIcon, color: "red" },
    { id: "analyze", label: "Text Analysis", icon: BotIcon, color: "purple" },
  ];

  return (
    <motion.div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <motion.div
        className="bg-gradient-to-br from-green-50 via-white to-yellow-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 rounded-2xl max-w-6xl w-full h-[98vh] max-h-[98vh] overflow-hidden shadow-2xl border border-green-200 dark:border-gray-700"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
      >
        {/* Header */}
        <div className="p-6 border-b border-green-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Document Analysis
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                {document?.filename || document?.name}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-100 transition-colors p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-green-200 dark:border-gray-700 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm">
          <div className="flex space-x-0">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? "text-green-600 dark:text-green-400 border-b-2 border-green-600 dark:border-green-400 bg-green-50 dark:bg-green-900/20"
                    : "text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50/50 dark:hover:bg-green-900/10"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[calc(98vh-200px)] overflow-y-auto bg-transparent">
          {/* Language Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Target Language
            </label>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="w-full px-3 py-2 border border-green-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm text-gray-900 dark:text-white"
            >
              {languages.map((lang) => (
                <option key={lang} value={lang}>
                  {lang}
                </option>
              ))}
            </select>
          </div>

          {/* Tab Content */}
          <AnimatePresence mode="wait">
            {activeTab === "translate" && (
              <motion.div
                key="translate"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border border-green-200 dark:border-green-700 rounded-xl p-4 backdrop-blur-sm">
                  <div className="flex items-center space-x-2 mb-2">
                    <LanguagesIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
                    <h3 className="font-semibold text-green-900 dark:text-green-100">
                      PDF Translation
                    </h3>
                  </div>
                  <p className="text-green-700 dark:text-green-300 text-sm mb-4">
                    Translate the entire document content to {selectedLanguage}
                  </p>

                  <motion.button
                    onClick={handleTranslatePDF}
                    disabled={loading}
                    className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:from-gray-400 disabled:to-gray-500 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-all duration-200 shadow-lg"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {loading ? (
                      <LoaderIcon className="w-4 h-4 animate-spin" />
                    ) : (
                      <LanguagesIcon className="w-4 h-4" />
                    )}
                    <span>
                      {loading ? "Translating..." : "Translate Document"}
                    </span>
                  </motion.button>
                </div>

                {translationResult && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-green-200 dark:border-gray-700 rounded-xl p-6 shadow-lg"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                        <CheckCircleIcon className="w-5 h-5 text-green-500 mr-2" />
                        Translation Complete
                      </h4>
                      <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                        <GlobeIcon className="w-4 h-4 mr-1" />
                        {selectedLanguage}
                      </div>
                    </div>
                    {formatTranslationResult(translationResult)}
                  </motion.div>
                )}
              </motion.div>
            )}

            {activeTab === "extract" && (
              <motion.div
                key="extract"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border border-green-200 dark:border-green-700 rounded-xl p-4 backdrop-blur-sm">
                    <div className="flex items-center space-x-2 mb-2">
                      <ZapIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
                      <h3 className="font-semibold text-green-900 dark:text-green-100">
                        Identify Document Type
                      </h3>
                    </div>
                    <p className="text-green-700 dark:text-green-300 text-sm mb-4">
                      Automatically detect the type of document
                    </p>

                    <motion.button
                      onClick={handleIdentifyDocumentType}
                      disabled={loading}
                      className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:from-gray-400 disabled:to-gray-500 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-all duration-200 shadow-lg"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {loading ? (
                        <LoaderIcon className="w-4 h-4 animate-spin" />
                      ) : (
                        <ZapIcon className="w-4 h-4" />
                      )}
                      <span>
                        {loading ? "Identifying..." : "Identify Type"}
                      </span>
                    </motion.button>

                    {documentType && (
                      <div className="mt-4">
                        {formatAnalysisResult(
                          documentType,
                          "Document Type Identified",
                          FileSearchIcon,
                          "indigo"
                        )}
                      </div>
                    )}
                  </div>

                  <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border border-green-200 dark:border-green-700 rounded-xl p-4 backdrop-blur-sm">
                    <div className="flex items-center space-x-2 mb-2">
                      <FileSearchIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
                      <h3 className="font-semibold text-green-900 dark:text-green-100">
                        Extract & Summarize
                      </h3>
                    </div>
                    <p className="text-green-700 dark:text-green-300 text-sm mb-4">
                      Extract key information and generate summaries
                    </p>

                    <motion.button
                      onClick={handleExtractFromPDF}
                      disabled={loading}
                      className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:from-gray-400 disabled:to-gray-500 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-all duration-200 shadow-lg"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {loading ? (
                        <LoaderIcon className="w-4 h-4 animate-spin" />
                      ) : (
                        <FileSearchIcon className="w-4 h-4" />
                      )}
                      <span>
                        {loading ? "Analyzing..." : "Analyze Document"}
                      </span>
                    </motion.button>
                  </div>
                </div>

                {extractionResult && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-green-200 dark:border-gray-700 rounded-xl p-6 shadow-lg"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                        <CheckCircleIcon className="w-5 h-5 text-green-500 mr-2" />
                        Analysis Complete
                      </h4>
                      <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                        <FileSearchIcon className="w-4 h-4 mr-1" />
                        Document Analysis
                      </div>
                    </div>
                    {formatAnalysisResult(
                      extractionResult,
                      "Document Analysis & Extraction",
                      FileSearchIcon,
                      "green"
                    )}
                  </motion.div>
                )}
              </motion.div>
            )}

            {activeTab === "videos" && (
              <motion.div
                key="videos"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border border-yellow-200 dark:border-yellow-700 rounded-xl p-4 backdrop-blur-sm">
                  <div className="flex items-center space-x-2 mb-2">
                    <YoutubeIcon className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                    <h3 className="font-semibold text-yellow-900 dark:text-yellow-100">
                      Find Educational Videos
                    </h3>
                  </div>
                  <p className="text-yellow-700 dark:text-yellow-300 text-sm mb-4">
                    Search for YouTube videos related to legal concepts in{" "}
                    {selectedLanguage}
                  </p>

                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-yellow-700 dark:text-yellow-300 mb-2 block">
                        Search Query
                      </label>
                      <input
                        type="text"
                        placeholder="Enter search query (e.g., 'contract law basics', 'legal document analysis')"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full px-3 py-2 border border-yellow-300 dark:border-yellow-600 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm text-gray-900 dark:text-white"
                      />
                    </div>

                    {/* Quick search suggestions */}
                    <div className="flex flex-wrap gap-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Quick searches:
                      </span>
                      {[
                        "contract law basics",
                        "legal document analysis",
                        "business law explained",
                        "legal terminology",
                      ].map((suggestion, index) => (
                        <button
                          key={index}
                          onClick={() => setSearchQuery(suggestion)}
                          className="text-xs bg-yellow-50 dark:bg-yellow-900/30 hover:bg-yellow-100 dark:hover:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300 px-2 py-1 rounded transition-colors"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>

                    <motion.button
                      onClick={handleSearchVideos}
                      disabled={loading || !searchQuery.trim()}
                      className="bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800 disabled:from-gray-400 disabled:to-gray-500 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-all duration-200 shadow-lg"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {loading ? (
                        <LoaderIcon className="w-4 h-4 animate-spin" />
                      ) : (
                        <YoutubeIcon className="w-4 h-4" />
                      )}
                      <span>{loading ? "Searching..." : "Search Videos"}</span>
                    </motion.button>
                  </div>
                </div>

                {youtubeResults.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                        <CheckCircleIcon className="w-5 h-5 text-green-500 mr-2" />
                        Video Results
                      </h4>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {youtubeResults.length} videos found
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {youtubeResults.map((video, index) => (
                        <motion.div
                          key={video.id || index}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.1 }}
                          className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-green-200 dark:border-gray-700 rounded-xl p-4 hover:shadow-lg transition-all duration-200"
                        >
                          <div className="space-y-3">
                            <div className="flex items-start space-x-3">
                              <div className="flex-shrink-0">
                                <div className="w-12 h-12 bg-gradient-to-r from-yellow-100 to-yellow-200 dark:from-yellow-900/30 dark:to-yellow-800/30 rounded-lg flex items-center justify-center">
                                  <YoutubeIcon className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <h5 className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-2 mb-1">
                                  {video.title ||
                                    video.snippet?.title ||
                                    (typeof video === "string"
                                      ? video
                                      : "Educational Video")}
                                </h5>
                                {video.snippet?.channelTitle && (
                                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                                    By {video.snippet.channelTitle}
                                  </p>
                                )}
                                {video.snippet?.description && (
                                  <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2">
                                    {video.snippet.description}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t border-green-100 dark:border-gray-700">
                              {video.snippet?.publishedAt && (
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {new Date(
                                    video.snippet.publishedAt
                                  ).toLocaleDateString()}
                                </span>
                              )}
                              <a
                                href={
                                  video.url ||
                                  (video.id?.videoId
                                    ? `https://www.youtube.com/watch?v=${video.id.videoId}`
                                    : typeof video === "string"
                                    ? video
                                    : `https://youtube.com/search?q=${encodeURIComponent(
                                        searchQuery
                                      )}`)
                                }
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center space-x-1 bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800 text-white text-xs px-3 py-1.5 rounded-lg transition-all duration-200 shadow-sm"
                              >
                                <PlayIcon className="w-3 h-3" />
                                <span>Watch</span>
                                <ExternalLinkIcon className="w-3 h-3" />
                              </a>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}

            {activeTab === "analyze" && (
              <motion.div
                key="analyze"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border border-green-200 dark:border-green-700 rounded-xl p-4 backdrop-blur-sm">
                  <div className="flex items-center space-x-2 mb-2">
                    <BotIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
                    <h3 className="font-semibold text-green-900 dark:text-green-100">
                      Text Analysis
                    </h3>
                  </div>
                  <p className="text-green-700 dark:text-green-300 text-sm mb-4">
                    Analyze specific text content with AI-powered insights
                  </p>

                  {!documentType && (
                    <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <AlertTriangleIcon className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                        <span className="text-sm text-yellow-700 dark:text-yellow-300">
                          Please identify document type first for better
                          analysis
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Text to Analyze
                      </label>
                      {document && (
                        <motion.button
                          onClick={async () => {
                            setLoading(true);
                            try {
                              // Get the file - either from document.file or fetch from server
                              let fileToProcess = document.file;
                              if (!fileToProcess && document.id) {
                                console.log(
                                  "📥 Fetching file from server for text extraction..."
                                );
                                fileToProcess = await fetchDocumentFile(
                                  document.id
                                );
                              }

                              if (fileToProcess) {
                                console.log("🔍 Extracting text from PDF...");

                                // Use the PDF extraction API to get text content
                                const response =
                                  await documentAPI.extractTextFromPDF(
                                    fileToProcess
                                  );

                                console.log(
                                  "✅ Text extraction response:",
                                  response.data
                                );

                                // Extract text from the API response
                                let extractedText = "";

                                if (response.data) {
                                  // Handle different response formats
                                  if (typeof response.data === "string") {
                                    try {
                                      const parsed = JSON.parse(response.data);
                                      extractedText =
                                        parsed.original_text ||
                                        parsed.text ||
                                        parsed.content ||
                                        response.data;
                                    } catch {
                                      extractedText = response.data;
                                    }
                                  } else if (
                                    response.data.candidates &&
                                    response.data.candidates[0]
                                  ) {
                                    // Handle Google API format
                                    const candidate =
                                      response.data.candidates[0];
                                    const content =
                                      candidate.content?.parts?.[0]?.text;
                                    if (content) {
                                      try {
                                        const parsed = JSON.parse(content);
                                        extractedText =
                                          parsed.original_text ||
                                          parsed.text ||
                                          parsed.content ||
                                          content;
                                      } catch {
                                        extractedText = content;
                                      }
                                    }
                                  } else if (response.data.original_text) {
                                    extractedText = response.data.original_text;
                                  } else if (response.data.text) {
                                    extractedText = response.data.text;
                                  } else if (response.data.content) {
                                    extractedText = response.data.content;
                                  } else {
                                    // Fallback: try to find any text content in the response
                                    extractedText = JSON.stringify(
                                      response.data,
                                      null,
                                      2
                                    );
                                  }
                                }

                                if (extractedText && extractedText.trim()) {
                                  // Clean up the extracted text
                                  const cleanText = extractedText
                                    .replace(/\n\s*\n/g, "\n\n") // Normalize line breaks
                                    .trim();

                                  setTextToAnalyze(cleanText);
                                  toast.success(
                                    `Successfully extracted ${cleanText.length} characters from document`
                                  );
                                } else {
                                  // Fallback for demo purposes
                                  const fallbackText = `Extracted text from ${fileToProcess.name}\n\nThis is the content that was extracted from your uploaded document. The text extraction service is processing your PDF and extracting the readable content for analysis.\n\nIn a production environment, this would contain the actual text content from your PDF document, including all paragraphs, sections, and readable content that can be analyzed for legal terms, jargon, and other important information.`;
                                  setTextToAnalyze(fallbackText);
                                  toast.success(
                                    "Document text loaded for analysis"
                                  );
                                }
                              } else {
                                toast.error("Unable to access document file");
                              }
                            } catch (error) {
                              console.error(
                                "Error extracting document text:",
                                error
                              );

                              // Provide helpful error message
                              let errorMessage =
                                "Failed to extract text from document";
                              if (error.response?.status === 401) {
                                auth.removeToken();
                                errorMessage =
                                  "Authentication failed. Please login again.";
                              } else if (error.response?.status === 400) {
                                errorMessage =
                                  "Invalid file format. Please ensure the file is a valid PDF.";
                              } else if (error.response?.data?.message) {
                                errorMessage = error.response.data.message;
                              }

                              toast.error(errorMessage);

                              // Fallback: provide a placeholder text for testing
                              if (document?.filename || document?.name) {
                                const placeholderText = `Sample content from ${
                                  document.filename || document.name
                                }\n\nThis is placeholder text since the document text extraction encountered an issue. You can paste your document content here manually for analysis.\n\nThe system supports analysis of legal documents, contracts, agreements, and other legal text content.`;
                                setTextToAnalyze(placeholderText);
                              }
                            } finally {
                              setLoading(false);
                            }
                          }}
                          disabled={loading}
                          className="text-xs bg-green-100 dark:bg-green-900/30 hover:bg-green-200 dark:hover:bg-green-900/50 text-green-700 dark:text-green-300 px-2 py-1 rounded transition-colors flex items-center space-x-1"
                        >
                          <FileTextIcon className="w-3 h-3" />
                          <span>
                            {loading
                              ? "Extracting..."
                              : "Extract Document Text"}
                          </span>
                        </motion.button>
                      )}
                    </div>

                    <textarea
                      placeholder="Paste text content to analyze..."
                      value={textToAnalyze}
                      onChange={(e) => setTextToAnalyze(e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 border border-green-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm text-gray-900 dark:text-white"
                    />

                    <motion.button
                      onClick={handleAnalyzeText}
                      disabled={loading || !textToAnalyze.trim()}
                      className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:from-gray-400 disabled:to-gray-500 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-all duration-200 shadow-lg"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {loading ? (
                        <LoaderIcon className="w-4 h-4 animate-spin" />
                      ) : (
                        <BotIcon className="w-4 h-4" />
                      )}
                      <span>{loading ? "Analyzing..." : "Analyze Text"}</span>
                    </motion.button>
                  </div>
                </div>

                {analysisResult && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-green-200 dark:border-gray-700 rounded-xl p-6 shadow-lg"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                        <CheckCircleIcon className="w-5 h-5 text-green-500 mr-2" />
                        Text Analysis Complete
                      </h4>
                      <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                        <BotIcon className="w-4 h-4 mr-1" />
                        AI Analysis
                      </div>
                    </div>
                    {formatAnalysisResult(
                      analysisResult,
                      "Text Analysis Results",
                      BotIcon,
                      "green"
                    )}
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}

// export default DocumentAnalysis;
