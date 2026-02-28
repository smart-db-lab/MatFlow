import { z } from "zod";

// Helper function to validate date format (YYYY, YYYY-MM, or YYYY-MM-DD)
const dateStringSchema = z.string().regex(
  /^(\d{4}|\d{4}-\d{2}|\d{4}-\d{2}-\d{2})$/,
  "Date must be in format YYYY, YYYY-MM, or YYYY-MM-DD"
);

// Optional string with max length
const optionalString = (max, msg) => z.string().max(max, msg).optional().or(z.literal(""));

// Journal Schema - required: title, journalName
export const journalSchema = z.object({
  title: z.string().min(1, "Title is required").max(255, "Title must be less than 255 characters"),
  authors: optionalString(500, "Authors must be less than 500 characters"),
  year: z.string().optional().or(z.literal("")),
  month: z.string().optional(),
  day: z.string().optional(),
  journalName: z.string().min(1, "Journal name is required").max(255, "Journal name must be less than 255 characters"),
  volume: optionalString(50, "Volume must be less than 50 characters"),
  issue: optionalString(50, "Issue must be less than 50 characters"),
  pages: optionalString(50, "Pages must be less than 50 characters"),
  issn: optionalString(30, "ISSN must be less than 30 characters"),
  publisher: optionalString(255, "Publisher must be less than 255 characters"),
  doi: z.string().optional().or(z.literal("")).refine(
    (val) => {
      if (!val || val.trim() === "") return true;
      if (val.startsWith("http")) return true;
      return /^(doi:)?10\.\d+\/.+$/.test(val);
    },
    { message: "DOI must be a valid URL or in format 10.xxxx/xxxx or doi:10.xxxx/xxxx" }
  ),
});

// Conference Schema - required: title, conferenceName
export const conferenceSchema = z.object({
  title: z.string().min(1, "Title is required").max(255, "Title must be less than 255 characters"),
  authors: optionalString(500, "Authors must be less than 500 characters"),
  year: z.string().optional().or(z.literal("")),
  month: z.string().optional(),
  day: z.string().optional(),
  conferenceName: z.string().min(1, "Conference name is required").max(255, "Conference name must be less than 255 characters"),
  venue: optionalString(255, "Venue must be less than 255 characters"),
  isbn: optionalString(50, "ISBN must be less than 50 characters"),
  pages: optionalString(50, "Pages must be less than 50 characters"),
  publisher: optionalString(255, "Publisher must be less than 255 characters"),
  doi: z.string().optional().or(z.literal("")).refine(
    (val) => {
      if (!val || val.trim() === "") return true;
      if (val.startsWith("http")) return true;
      return /^(doi:)?10\.\d+\/.+$/.test(val);
    },
    { message: "DOI must be a valid URL or in format 10.xxxx/xxxx or doi:10.xxxx/xxxx" }
  ),
});

// Book Schema - required: title, authors
export const bookSchema = z.object({
  title: z.string().min(1, "Title is required").max(255, "Title must be less than 255 characters"),
  authors: z.string().min(1, "Authors are required").max(500, "Authors must be less than 500 characters"),
  year: z.string().optional().or(z.literal("")),
  month: z.string().optional(),
  day: z.string().optional(),
  pages: optionalString(50, "Pages must be less than 50 characters"),
  isbn: optionalString(50, "ISBN must be less than 50 characters"),
  publisher: optionalString(255, "Publisher must be less than 255 characters"),
  doi: z.string().optional().or(z.literal("")).refine(
    (val) => {
      if (!val || val.trim() === "") return true;
      if (val.startsWith("http")) return true;
      return /^(doi:)?10\.\d+\/.+$/.test(val);
    },
    { message: "DOI must be a valid URL or in format 10.xxxx/xxxx or doi:10.xxxx/xxxx" }
  ),
});

// Patent Schema - required: title only
export const patentSchema = z.object({
  title: z.string().min(1, "Title is required").max(255, "Title must be less than 255 characters"),
  inventors: optionalString(500, "Inventors must be less than 500 characters"),
  year: z.string().optional().or(z.literal("")),
  month: z.string().optional(),
  day: z.string().optional(),
  patentLink: z.string().url("Patent link must be a valid URL").optional().or(z.literal("")),
  patentOffice: optionalString(255, "Patent office must be less than 255 characters"),
  patentNumber: optionalString(100, "Patent number must be less than 100 characters"),
  applicationNumber: optionalString(100, "Application number must be less than 100 characters"),
});

// Dataset Schema - required: title only
export const datasetSchema = z.object({
  title: z.string().min(1, "Title is required").max(255, "Title must be less than 255 characters"),
  originators: optionalString(500, "Originators must be less than 500 characters"),
  year: z.string().optional().or(z.literal("")),
  month: z.string().optional(),
  day: z.string().optional(),
  underPublication: optionalString(255, "Under publication must be less than 255 characters"),
  keywords: optionalString(500, "Keywords must be less than 500 characters"),
});

// Helper function to format publication date
export const formatPublicationDate = (year, month, day) => {
  if (!year) return "";
  let date = year;
  if (month) {
    date += `-${String(month).padStart(2, "0")}`;
    if (day) {
      date += `-${String(day).padStart(2, "0")}`;
    }
  }
  return date;
};
