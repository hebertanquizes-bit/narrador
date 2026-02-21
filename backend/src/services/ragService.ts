import { Chroma } from "@langchain/community/vectorstores/chroma";
import { OllamaEmbeddings } from "@langchain/community/embeddings/ollama";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import pdfParse from "pdf-parse";
import fs from "fs-extra";
import path from "path";

// Initialize Ollama embeddings (local, free)
const embeddings = new OllamaEmbeddings({
  model: "mistral",
  baseUrl: "http://localhost:11434",
});

let vectorStore: Chroma | null = null;

/**
 * Initialize Chroma vector store (local SQLite)
 */
export async function initializeRAG() {
  try {
    // Chroma API requires collection to exist first
    // For MVP, we'll skip if Ollama not available
    console.log("⚠️  RAG (Chroma) requires Ollama running at http://localhost:11434");
    console.log("   Install: https://ollama.ai");
    vectorStore = null;
  } catch (error) {
    console.warn("⚠️  Chroma not available, will use in-memory store");
    vectorStore = null;
  }
}

/**
 * Extract text from PDF file
 */
async function extractPdfText(filePath: string): Promise<string> {
  const buffer = await fs.readFile(filePath);
  const pdfData = await pdfParse(buffer);
  return pdfData.text;
}

/**
 * Extract text from plain text file
 */
async function extractTextFile(filePath: string): Promise<string> {
  return fs.readFile(filePath, "utf-8");
}

/**
 * Index asset for RAG search
 */
export async function indexAsset(
  assetPath: string,
  metadata: {
    assetId: string;
    name: string;
    type: string;
    userId: string;
  }
): Promise<{ chunks: number; success: boolean }> {
  try {
    let text: string;
    const ext = path.extname(assetPath).toLowerCase();

    // Extract text based on file type
    if (ext === ".pdf") {
      text = await extractPdfText(assetPath);
    } else if ([".txt", ".md", ".json"].includes(ext)) {
      text = await extractTextFile(assetPath);
    } else {
      throw new Error(`Unsupported file type: ${ext}`);
    }

    if (!text || text.length < 10) {
      throw new Error("Asset text too short to index");
    }

    // Split into chunks
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });
    const chunks = await splitter.splitText(text);

    // Add to vector store
    if (vectorStore) {
      await vectorStore.addDocuments(
        chunks.map((chunk, i) => ({
          pageContent: chunk,
          metadata: {
            assetId: metadata.assetId,
            name: metadata.name,
            type: metadata.type,
            userId: metadata.userId,
            chunkIndex: i,
          },
        }))
      );
    }

    console.log(
      `✅ Indexed ${chunks.length} chunks from ${metadata.name}`
    );

    return { chunks: chunks.length, success: true };
  } catch (error) {
    console.error("❌ Error indexing asset:", error);
    return { chunks: 0, success: false };
  }
}

/**
 * Search for relevant context
 */
export async function searchContext(
  query: string,
  k: number = 5
): Promise<
  Array<{
    content: string;
    assetId: string;
    name: string;
    type: string;
    relevance: number;
  }>
> {
  if (!vectorStore) {
    return [];
  }

  try {
    const results = await vectorStore.similaritySearchWithScore(query, k);

    return results.map((result, index) => ({
      content: result[0].pageContent,
      assetId: result[0].metadata.assetId as string,
      name: result[0].metadata.name as string,
      type: result[0].metadata.type as string,
      relevance: 1 - result[1], // Convert distance to similarity
    }));
  } catch (error) {
    console.error("❌ Error searching context:", error);
    return [];
  }
}

/**
 * Get context summary for narrative
 */
export async function getContextSummary(query: string): Promise<string> {
  const results = await searchContext(query, 3);

  if (results.length === 0) {
    return "";
  }

  return results
    .map(
      (r) =>
        `[${r.type.toUpperCase()}: ${r.name}]\n${r.content.substring(0, 300)}...`
    )
    .join("\n\n---\n\n");
}
