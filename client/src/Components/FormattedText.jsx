import React from "react";

/**
 * FormattedText Component
 * Renders text with formatting metadata as HTML
 * Converts JSON segments to HTML with appropriate tags (<strong>, <em>, <u>)
 */
function FormattedText({ 
  text, 
  formatting = null, 
  className = "" 
}) {
  // If no formatting metadata, return plain text
  if (!formatting || !Array.isArray(formatting) || formatting.length === 0) {
    return <span className={className}>{text || ""}</span>;
  }

  // Render formatted segments
  const renderFormattedText = () => {
    return formatting.map((segment, index) => {
      if (!segment.text) return null;

      let content = segment.text;

      // Apply formatting tags
      if (segment.bold) {
        content = <strong key={`bold-${index}`}>{content}</strong>;
      }
      if (segment.italic) {
        content = <em key={`italic-${index}`}>{content}</em>;
      }
      if (segment.underline) {
        content = <u key={`underline-${index}`}>{content}</u>;
      }

      // If multiple formats, wrap appropriately
      if (segment.bold && segment.italic && segment.underline) {
        content = (
          <strong key={`all-${index}`}>
            <em>
              <u>{segment.text}</u>
            </em>
          </strong>
        );
      } else if (segment.bold && segment.italic) {
        content = (
          <strong key={`bold-italic-${index}`}>
            <em>{segment.text}</em>
          </strong>
        );
      } else if (segment.bold && segment.underline) {
        content = (
          <strong key={`bold-underline-${index}`}>
            <u>{segment.text}</u>
          </strong>
        );
      } else if (segment.italic && segment.underline) {
        content = (
          <em key={`italic-underline-${index}`}>
            <u>{segment.text}</u>
          </em>
        );
      } else if (!segment.bold && !segment.italic && !segment.underline) {
        // Plain text
        content = <span key={`plain-${index}`}>{segment.text}</span>;
      }

      return <span key={`segment-${index}`}>{content}</span>;
    });
  };

  return <span className={className}>{renderFormattedText()}</span>;
}

export default FormattedText;


