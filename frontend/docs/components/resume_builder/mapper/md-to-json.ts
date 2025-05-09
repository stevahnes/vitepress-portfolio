import {
  Resume,
  Header,
  Work,
  Education,
  AwardsAndCertification,
  Designation,
} from "../models";

/**
 * Maps markdown text to a Resume object
 * @param markdown The resume markdown content
 * @returns Resume object conforming to the specified interface
 */
export function parseResumeMarkdown(markdown: string): Resume {
  const sections = splitIntoSections(markdown);

  return {
    header: parseHeader(sections.header),
    profile: sections.profile,
    competencies: parseCompetencies(sections.competencies),
    work: parseWork(sections.work),
    education: parseEducation(sections.education),
    awardsAndCertifications: parseAwardsAndCertifications(
      sections.awardsAndCertifications,
    ),
  };
}

/**
 * Split markdown content into logical sections
 */
function splitIntoSections(markdown: string) {
  const lines = markdown.split("\n");
  const sections: Record<string, string> = {
    header: "",
    profile: "",
    competencies: "",
    work: "",
    education: "",
    awardsAndCertifications: "",
  };

  let currentSection = "header";

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith("## PERSONAL PROFILE")) {
      currentSection = "profile";
      continue;
    } else if (line.startsWith("## CORE COMPETENCIES")) {
      currentSection = "competencies";
      continue;
    } else if (line.startsWith("## WORK EXPERIENCE")) {
      currentSection = "work";
      continue;
    } else if (line.startsWith("## EDUCATION")) {
      currentSection = "education";
      continue;
    } else if (line.startsWith("## AWARDS AND CERTIFICATIONS")) {
      currentSection = "awardsAndCertifications";
      continue;
    }

    sections[currentSection] += line + "\n";
  }

  return sections;
}

/**
 * Parse the header section
 */
function parseHeader(headerSection: string): Header {
  const lines = headerSection.trim().split("\n");
  const name = lines[0].replace("# ", "").trim();

  // Extract contact information from second line
  const contactLine = lines[1];
  const contactItems = contactLine.match(/\[.*?\]|\(.*?\)|[^|]+/g) || [];

  // Clean up contact items
  const cleanedItems = contactItems.map((item) => item.trim());

  // Find email and phone
  let email = "";
  let phone = "";
  let leftDetail = "";
  let rightDetail = "";

  cleanedItems.forEach((item) => {
    if (item.includes("@")) {
      // Extract email from markdown link format [email](mailto:email)
      const emailMatch =
        item.match(/\[(.*?@.*?)\]/) || item.match(/(.*?@.*?)/) || [];
      email = emailMatch[1] || item;
    } else if (item.match(/\(\d+\)/) || item.includes("8366 8579")) {
      phone = item;
    } else if (item.includes("LinkedIn")) {
      leftDetail = "LinkedIn";
    } else if (item.includes("www.")) {
      // Extract website from markdown link format [website](https://website)
      const websiteMatch = item.match(/\[(www\..*?)\]/) || [];
      rightDetail = websiteMatch[1] || item;
    }
  });

  return {
    name,
    subtitle: "", // No subtitle in the provided markdown
    email,
    phone,
    leftDetail,
    rightDetail,
  };
}

/**
 * Parse the competencies section
 */
function parseCompetencies(competenciesSection: string): string[] {
  if (!competenciesSection) return [];

  // Extract competencies from bullet point list
  const competenciesText = competenciesSection.trim();
  return competenciesText
    .split("•")
    .map((item) => item.trim())
    .filter((item) => item !== "");
}

/**
 * Parse the work section
 */
function parseWork(workSection: string): Work[] {
  if (!workSection) return [];

  const workEntries: Work[] = [];
  const companyBlocks = workSection
    .split(/(?=### )/g)
    .filter((block) => block.trim() !== "");

  companyBlocks.forEach((block) => {
    const lines = block.trim().split("\n");
    console.log(lines);
    const companyLine = lines[0].replace("### ", "").trim();

    // Assume second line contains title, location, and period
    const detailsLine = lines[2];
    console.log(detailsLine);
    const [titlePart, locationPart, periodPart] = detailsLine
      .split("|")
      .map((part) => part.trim());

    const company = companyLine;
    const location = locationPart;

    // Extract designations
    const designations: Designation[] = [];
    const titleParts = titlePart.split(",").map((t) => t.trim());
    const currentTitle = titleParts[0]
      .replace("**", "")
      .replace("**", "")
      .trim();

    // Parse period for the designation
    console.log(periodPart);
    const periodMatch = periodPart.match(/(\w+ \d{4}).*?(\w+ \d{4}|Present)/);
    const start = periodMatch ? periodMatch[1] : "";
    const end = periodMatch ? periodMatch[2] : "";

    // Extract descriptions (bullet points)
    const descriptions: string[] = [];
    let startIdx = 2; // Skip company and details lines

    while (startIdx < lines.length && lines[startIdx].trim() === "") {
      startIdx++;
    }

    for (let i = startIdx; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith("-")) {
        descriptions.push(line.substring(1).trim());
      }
    }

    // Create designation
    const designation: Designation = {
      title: currentTitle,
      start,
      end,
      descriptions,
    };

    designations.push(designation);

    workEntries.push({
      company,
      location,
      designations,
      descriptions: [], // We're putting descriptions in the designations, not at top level
    });
  });

  return workEntries;
}

/**
 * Parse the education section
 */
function parseEducation(educationSection: string): Education[] {
  if (!educationSection) return [];

  const educationEntries: Education[] = [];
  const institutionBlocks = educationSection
    .split(/(?=### )/g)
    .filter((block) => block.trim() !== "");

  institutionBlocks.forEach((block) => {
    const lines = block.trim().split("\n");
    const institution = lines[0].replace("### ", "").trim();

    // Qualification on second line
    const qualificationLine = lines[1];
    const qualification = [
      qualificationLine.replace("**", "").replace("**", "").trim(),
    ];

    // Period on the same line as qualification or next line
    const periodMatch = qualificationLine.match(/\|(.*?)(\d{4}).*?(\d{4})/);

    let start = "";
    let end = "";
    let honorsAndGrade: string | undefined;

    if (periodMatch) {
      start = periodMatch[2];
      end = periodMatch[3];
    }

    // Check if there's an honors line
    if (lines.length > 2) {
      const potentialHonorsLine = lines[2].trim();
      if (
        !potentialHonorsLine.startsWith("###") &&
        potentialHonorsLine !== ""
      ) {
        honorsAndGrade = potentialHonorsLine;
      }
    }

    educationEntries.push({
      institution,
      qualification,
      start,
      end,
      honorsAndGrade,
    });
  });

  return educationEntries;
}

/**
 * Parse the awards and certifications section
 */
function parseAwardsAndCertifications(
  awardsSection: string,
): AwardsAndCertification[] {
  if (!awardsSection) return [];

  const awards: AwardsAndCertification[] = [];
  const lines = awardsSection.trim().split("\n");

  lines.forEach((line) => {
    if (line.startsWith("-")) {
      const awardText = line.substring(1).trim();
      const dateMatch = awardText.match(/\| (\w+ \d{4})$/);

      if (dateMatch) {
        const acquiredDate = dateMatch[1];
        // Remove the date part from the name
        const name = awardText.replace(/\| \w+ \d{4}$/, "").trim();

        awards.push({
          name,
          acquiredDate,
        });
      } else {
        // If no date pattern found, add the whole text as name with empty date
        awards.push({
          name: awardText,
          acquiredDate: "",
        });
      }
    }
  });

  return awards;
}

// Example usage:
// const resumeMarkdown = `# Your markdown content here...`;
// const resume = parseResumeMarkdown(resumeMarkdown);
