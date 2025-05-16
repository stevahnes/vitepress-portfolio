<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import jsPDF from "jspdf";
import { Resume } from "./resume_builder/models";
import { Cursor } from "./resume_builder/class";
import { parseResumeMarkdown } from "./resume_builder/mapper";
import { OnePageStandard } from "./resume_builder/templates/one-page-standard/constants";
import { generateOnePageStandardPDF } from "./resume_builder/templates/one-page-standard/logic";
import { useData } from "vitepress";

// Access VitePress theme data
const { isDark } = useData();

// Props for customization
const props = defineProps({
  filename: {
    type: String,
    default: "Stevanus SATRIA.pdf",
  },
  buttonText: {
    type: String,
    default: "Download Resume",
  },
  openInNewTab: {
    type: Boolean,
    default: false,
  },
});

// Use client-side only rendering to prevent hydration mismatch
const isClient = ref(false);
onMounted(() => {
  isClient.value = true;
});

// Store the markdown content
const resumeMarkdown = ref<string>("");

// Extract the markdown content from the VitePress page
onMounted(() => {
  if (!isClient.value) return;

  // Get the content div that VitePress generates for the markdown page
  const contentElement = document.querySelector(".vp-doc");

  if (contentElement) {
    // Clone the content to avoid modifying the DOM
    const contentClone = contentElement.cloneNode(true) as HTMLElement;

    // Remove the download button to avoid including it in the resume markdown
    const downloadButtonContainer = contentClone.querySelector(
      'div[style*="text-align: right"]',
    );
    if (downloadButtonContainer) {
      downloadButtonContainer.remove();
    }

    // Get the markdown content as HTML and convert to plain text
    resumeMarkdown.value = getMarkdownFromHTML(contentClone);
  } else {
    console.error("Could not find VitePress markdown content");
  }
});

// Function to convert HTML to plain text while preserving markdown structure
function getMarkdownFromHTML(element: HTMLElement): string {
  // Start with empty string
  let markdown = "";

  // Process headings, paragraphs, lists, etc.
  const processNode = (node: Node): string => {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent || "";
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      const tagName = el.tagName.toLowerCase();

      // Process all child nodes for elements that might contain formatted content
      const processChildren = () => {
        let content = "";
        el.childNodes.forEach((child) => {
          content += processNode(child);
        });
        return content;
      };

      // Handle different HTML tags with corresponding markdown
      switch (tagName) {
        case "h1":
          return `# ${processChildren()}\n\n`;
        case "h2":
          return `## ${processChildren()}\n\n`;
        case "h3":
          return `### ${processChildren()}\n\n`;
        case "p":
          return `${processChildren()}\n\n`;
        case "ul":
          let listItems = "";
          el.querySelectorAll("li").forEach((li) => {
            // Process each list item to handle nested elements
            listItems += `- ${processNode(li)}\n`;
          });
          return listItems + "\n";
        case "li":
          return processChildren();
        case "a":
          return `[${el.textContent}](${el.getAttribute("href")})`;
        case "strong":
        case "b":
          return `**${processChildren()}**`;
        case "br":
          return "\n";
        default:
          // Process children for other elements
          return processChildren();
      }
    }

    return "";
  };
  // Process all child nodes
  element.childNodes.forEach((child) => {
    markdown += processNode(child);
  });

  return markdown;
}

// Generate and download the PDF
function downloadResume() {
  if (!isClient.value) return;
  if (!resumeMarkdown.value) {
    console.error("Resume markdown content not found");
    return;
  }

  try {
    // Parse the markdown to get the Resume object
    const resume: Resume = parseResumeMarkdown(resumeMarkdown.value);

    // Create a new PDF document
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    // Initialize cursor for PDF generation
    const cursor = new Cursor(0, 0, OnePageStandard.HEADER_FONT_SIZE);

    // Call the provided function to generate the PDF
    generateOnePageStandardPDF(resume, doc, cursor);

    if (props.openInNewTab) {
      // Generate PDF blob instead of data URL
      const pdfBlob = doc.output("blob");
      const pdfUrl = URL.createObjectURL(pdfBlob);

      // Create a temporary link element
      const link = document.createElement("a");
      link.href = pdfUrl;
      link.target = "_blank";
      link.rel = "noopener noreferrer";

      // Set the filename
      link.download = props.filename;

      // Append to body, click, and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up the URL object after a delay
      setTimeout(() => {
        URL.revokeObjectURL(pdfUrl);
      }, 100);
    } else {
      // Save the PDF with the provided filename
      doc.save(props.filename);
    }
  } catch (error) {
    console.error("Error generating PDF:", error);
  }
}
</script>

<template>
  <button
    v-if="isClient"
    @click="downloadResume"
    :class="[
      '!border-none !py-2.5 !px-6 !text-center !no-underline !inline-block !text-base !m-1 !cursor-pointer !rounded-full !font-medium !transition-all !duration-300 !shadow-sm',
      '!font-sans !tracking-wide',
      isDark
        ? '!bg-[#0059aa] hover:!bg-[#004c91]'
        : '!bg-[#3e94e8] hover:!bg-[#2a7fd1]',
      '!text-white',
    ]"
  >
    {{ buttonText || "Download Resume" }}
  </button>
  <button
    v-else
    class="!border-none !py-2.5 !px-6 !text-center !no-underline !inline-block !text-base !m-1 !cursor-pointer !rounded-full !font-medium !transition-all !duration-300 !shadow-sm !font-sans !tracking-wide !bg-[#0059aa] !text-white"
  >
    {{ buttonText || "Download Resume" }}
  </button>
</template>

<style scoped>
/* No additional styles needed as we're using Tailwind with !important flags */
</style>
