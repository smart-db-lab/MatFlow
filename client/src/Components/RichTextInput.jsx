import React, { useState, useRef, useEffect } from "react";

/**
 * RichTextInput Component
 * Provides text input with inline formatting buttons (Bold, Italic, Underline)
 * Stores formatting as JSON array of segments
 */
function RichTextInput({
  value = "",
  onChange,
  onFormattingChange, // Callback to receive formatting segments
  name,
  placeholder = "",
  className = "",
  isAuthorField = false, // Backwards-compat flag for author mode (will be superseded by mode)
  mode = "full", // "full" | "author" - full = whole-field formatting, author = per-author / selection
  formattingMetadata = null, // Existing formatting metadata when editing
}) {
  // Resolve effective mode - prefer explicit mode prop, fall back to legacy isAuthorField flag
  const isAuthorMode = mode === "author" || isAuthorField;
  const isFullMode = !isAuthorMode;

  const inputRef = useRef(null);
  const [selectionStart, setSelectionStart] = useState(0);
  const [selectionEnd, setSelectionEnd] = useState(0);
  const [segments, setSegments] = useState([]);
  const isApplyingFormatting = useRef(false); // Flag to prevent handleTextChange from resetting segments during formatting
  const nextCharFormatting = useRef({ bold: false, italic: false, underline: false }); // Formatting for next typed character
  const prevSegmentsRef = useRef(null); // Track previous segments to prevent unnecessary callbacks
  const onFormattingChangeRef = useRef(onFormattingChange); // Store callback in ref

  // Initialize segments from formattingMetadata or plain text
  const prevFormattingMetadataRef = useRef(null);
  const prevValueRef = useRef(null);
  const isInitializedRef = useRef(false);
  
  useEffect(() => {
    const formattingChanged = JSON.stringify(formattingMetadata) !== JSON.stringify(prevFormattingMetadataRef.current);
    const valueChanged = value !== prevValueRef.current;
    const currentText = getPlainText(segments);
    
    // Priority 1: If formattingMetadata is provided and valid, use it
    if (formattingMetadata && Array.isArray(formattingMetadata) && formattingMetadata.length > 0) {
      if (formattingChanged || !isInitializedRef.current) {
        setSegments(formattingMetadata);
        prevFormattingMetadataRef.current = formattingMetadata;
        prevValueRef.current = value;
        isInitializedRef.current = true;
        return;
      }
    } 
    // Priority 2: Initialize from value if segments are empty (first load)
    else if (segments.length === 0) {
      if (value) {
        setSegments([{ text: value, bold: false, italic: false, underline: false }]);
      } else {
        setSegments([]);
      }
      prevValueRef.current = value;
      prevFormattingMetadataRef.current = formattingMetadata;
      isInitializedRef.current = true;
      return;
    }
    // Priority 3: If value changed and we have no formatting metadata, update segments if they're plain
    else if (valueChanged && (!formattingMetadata || (Array.isArray(formattingMetadata) && formattingMetadata.length === 0))) {
      // Only update if current segments have no formatting
      const hasFormatting = segments.some(s => s.bold || s.italic || s.underline);
      if (!hasFormatting && currentText !== value) {
        setSegments([{ text: value, bold: false, italic: false, underline: false }]);
        prevValueRef.current = value;
      }
    }
    
    // Update refs even if we didn't change segments
    if (valueChanged) prevValueRef.current = value;
    if (formattingChanged) prevFormattingMetadataRef.current = formattingMetadata;
  }, [formattingMetadata, value]);

  // Get plain text from segments
  const getPlainText = (segmentsArray) => {
    return segmentsArray.map((seg) => seg.text).join("");
  };

    // Handle text input change - preserve formatting when possible
  const handleTextChange = (e) => {
    const newValue = e.target.value;
    // Skip if formatting is being applied (to prevent resetting segments)
    if (isApplyingFormatting.current) {
      return;
    }
    const input = e.target;
    const cursorPos = input.selectionStart;
    setSelectionStart(cursorPos);
    setSelectionEnd(cursorPos);
    
    const currentText = getPlainText(segments);
    
    // If text hasn't changed, just update cursor position
    if (newValue === currentText) {
      return;
    }
    
    // If new character was typed and we have next char formatting, apply it
    if (newValue.length > currentText.length && nextCharFormatting.current) {
      const format = nextCharFormatting.current;
      if (format.bold || format.italic || format.underline) {
        // Find where the new character was inserted
        const insertedChar = newValue[cursorPos - 1];
        if (insertedChar) {
          // Apply formatting to the new character
          // This will be handled by the segment update logic below
        }
      }
    }

    // Simple approach: try to preserve formatting by matching text
    if (segments.length > 0 && currentText.length > 0) {
      // Find common prefix and suffix to preserve formatting
      let prefixEnd = 0;
      while (prefixEnd < Math.min(currentText.length, newValue.length) && 
             currentText[prefixEnd] === newValue[prefixEnd]) {
        prefixEnd++;
      }
      
      let suffixStart = currentText.length;
      let suffixStartNew = newValue.length;
      while (suffixStart > prefixEnd && suffixStartNew > prefixEnd &&
             currentText[suffixStart - 1] === newValue[suffixStartNew - 1]) {
        suffixStart--;
        suffixStartNew--;
      }
      
      // Rebuild segments: preserve prefix and suffix formatting, plain text for middle
      const newSegments = [];
      let pos = 0;
      
      // Add prefix with preserved formatting
      if (prefixEnd > 0) {
        for (const segment of segments) {
          if (pos >= prefixEnd) break;
          const segmentEnd = pos + segment.text.length;
          if (segmentEnd <= prefixEnd) {
            // Entire segment is in prefix
            newSegments.push({ ...segment });
            pos = segmentEnd;
          } else if (pos < prefixEnd) {
            // Segment partially in prefix
            newSegments.push({
              text: segment.text.substring(0, prefixEnd - pos),
              bold: segment.bold,
              italic: segment.italic,
              underline: segment.underline,
            });
            pos = prefixEnd;
            break;
          }
        }
      }
      
      // Add middle part (changed text) - apply nextCharFormatting if character was inserted
      const middleText = newValue.substring(prefixEnd, suffixStartNew);
      if (middleText) {
        // Check if this is a new character insertion (text got longer)
        const isInsertion = newValue.length > currentText.length && prefixEnd === cursorPos - 1;
        newSegments.push({
          text: middleText,
          bold: isInsertion ? nextCharFormatting.current.bold : false,
          italic: isInsertion ? nextCharFormatting.current.italic : false,
          underline: isInsertion ? nextCharFormatting.current.underline : false,
        });
        // Clear next char formatting after applying
        if (isInsertion) {
          nextCharFormatting.current = { bold: false, italic: false, underline: false };
        }
      }
      
      // Add suffix with preserved formatting
      if (suffixStart < currentText.length) {
        pos = suffixStart;
        for (const segment of segments) {
          const segmentStart = pos;
          const segmentEnd = pos + segment.text.length;
          if (segmentStart >= suffixStart) {
            if (segmentEnd <= currentText.length) {
              // Entire segment is in suffix
              newSegments.push({ ...segment });
              pos = segmentEnd;
            } else if (segmentStart < currentText.length) {
              // Segment partially in suffix
              const suffixText = newValue.substring(suffixStartNew);
              if (suffixText) {
                newSegments.push({
                  text: suffixText,
                  bold: segment.bold,
                  italic: segment.italic,
                  underline: segment.underline,
                });
              }
              break;
            }
          } else {
            pos = segmentEnd;
          }
        }
      }
      
      // Merge adjacent segments with same formatting
      const mergedSegments = [];
      newSegments.forEach((segment) => {
        if (segment.text === "") return;
        const last = mergedSegments[mergedSegments.length - 1];
        if (
          last &&
          last.bold === segment.bold &&
          last.italic === segment.italic &&
          last.underline === segment.underline
        ) {
          last.text += segment.text;
        } else {
          mergedSegments.push({ ...segment });
        }
      });
      
      // Verify segments match new text
      const mergedText = getPlainText(mergedSegments);
      if (mergedText === newValue) {
        setSegments(mergedSegments);
      } else {
        // Fallback: create plain segment
        setSegments([{ text: newValue, bold: false, italic: false, underline: false }]);
      }
    } else {
      // No segments yet, create new one with nextCharFormatting if applicable
      const isNewText = newValue.length > 0;
      setSegments([{ 
        text: newValue, 
        bold: isNewText ? nextCharFormatting.current.bold : false, 
        italic: isNewText ? nextCharFormatting.current.italic : false, 
        underline: isNewText ? nextCharFormatting.current.underline : false 
      }]);
      if (isNewText) {
        nextCharFormatting.current = { bold: false, italic: false, underline: false };
      }
    }

    // Call parent onChange with plain text
    if (onChange) {
      onChange({
        target: {
          name,
          value: newValue,
        },
      });
    }
  };

  // Handle selection change
  const handleSelectionChange = (e) => {
    const input = e.target;
    setSelectionStart(input.selectionStart);
    setSelectionEnd(input.selectionEnd);
  };

  // Apply formatting to the entire field (full mode)
  const applyFullFieldFormatting = (formatType) => {
    const plainText = getPlainText(segments) || value || "";
    const current = segments[0] || { text: plainText, bold: false, italic: false, underline: false };

    const newFlags = {
      bold: formatType === "bold" ? !current.bold : current.bold,
      italic: formatType === "italic" ? !current.italic : current.italic,
      underline: formatType === "underline" ? !current.underline : current.underline,
    };

    const newSegments = plainText
      ? [
          {
            text: plainText,
            ...newFlags,
          },
        ]
      : [];

    setSegments(newSegments);
    prevSegmentsRef.current = newSegments;

    const newText = plainText;
    if (onFormattingChangeRef.current) {
      onFormattingChangeRef.current(name, newSegments);
    }
    if (onChange) {
      onChange({
        target: {
          name,
          value: newText,
          formatting: newSegments,
        },
      });
    }
  };

  // Apply formatting to selected text (author / selection mode)
  const applyFormatting = (formatType) => {
    const input = inputRef.current;
    if (!input) return;

    const start = input.selectionStart;
    const end = input.selectionEnd;

    // If no selection, set formatting for next typed character
    if (start === end) {
      nextCharFormatting.current[formatType] = !nextCharFormatting.current[formatType];
      // Update button visual state by forcing re-render
      setSelectionStart(start);
      setSelectionEnd(end);
      return;
    }

    const currentText = getPlainText(segments);
    const selectedText = currentText.substring(start, end);

    if (!selectedText) return;
    
    // Check if ALL selected text already has this formatting
    let allHaveFormatting = true;
    let checkPos = 0;
    for (const segment of segments) {
      const segmentStart = checkPos;
      const segmentEnd = checkPos + segment.text.length;
      
      if (segmentStart < end && segmentEnd > start) {
        // This segment overlaps with selection
        if (formatType === "bold" && !segment.bold) allHaveFormatting = false;
        if (formatType === "italic" && !segment.italic) allHaveFormatting = false;
        if (formatType === "underline" && !segment.underline) allHaveFormatting = false;
      }
      checkPos = segmentEnd;
    }
    
    // Toggle: if all have it, remove it; otherwise add it
    const shouldApply = !allHaveFormatting;
    
    // Set flag to prevent handleTextChange from resetting segments
    isApplyingFormatting.current = true;

    // Split segments to handle the selection
    let newSegments = [];
    let currentPos = 0;

    segments.forEach((segment) => {
      const segmentStart = currentPos;
      const segmentEnd = currentPos + segment.text.length;

      if (segmentEnd <= start || segmentStart >= end) {
        // Segment is outside selection, keep as is
        newSegments.push(segment);
      } else if (segmentStart < start && segmentEnd > end) {
        // Selection is within this segment, split it
        newSegments.push({
          text: segment.text.substring(0, start - segmentStart),
          bold: segment.bold,
          italic: segment.italic,
          underline: segment.underline,
        });
        newSegments.push({
          text: selectedText,
          bold: formatType === "bold" ? shouldApply : segment.bold,
          italic: formatType === "italic" ? shouldApply : segment.italic,
          underline: formatType === "underline" ? shouldApply : segment.underline,
        });
        newSegments.push({
          text: segment.text.substring(end - segmentStart),
          bold: segment.bold,
          italic: segment.italic,
          underline: segment.underline,
        });
      } else if (segmentStart < start) {
        // Segment starts before selection
        newSegments.push({
          text: segment.text.substring(0, start - segmentStart),
          bold: segment.bold,
          italic: segment.italic,
          underline: segment.underline,
        });
        newSegments.push({
          text: segment.text.substring(start - segmentStart),
          bold: formatType === "bold" ? shouldApply : segment.bold,
          italic: formatType === "italic" ? shouldApply : segment.italic,
          underline: formatType === "underline" ? shouldApply : segment.underline,
        });
      } else if (segmentEnd > end) {
        // Segment ends after selection
        newSegments.push({
          text: segment.text.substring(0, end - segmentStart),
          bold: formatType === "bold" ? shouldApply : segment.bold,
          italic: formatType === "italic" ? shouldApply : segment.italic,
          underline: formatType === "underline" ? shouldApply : segment.underline,
        });
        newSegments.push({
          text: segment.text.substring(end - segmentStart),
          bold: segment.bold,
          italic: segment.italic,
          underline: segment.underline,
        });
      } else {
        // Entire segment is within selection
        newSegments.push({
          text: segment.text,
          bold: formatType === "bold" ? shouldApply : segment.bold,
          italic: formatType === "italic" ? shouldApply : segment.italic,
          underline: formatType === "underline" ? shouldApply : segment.underline,
        });
      }

      currentPos = segmentEnd;
    });

    // Merge adjacent segments with same formatting
    const mergedSegments = [];
    newSegments.forEach((segment) => {
      if (segment.text === "") return;
      const last = mergedSegments[mergedSegments.length - 1];
      if (
        last &&
        last.bold === segment.bold &&
        last.italic === segment.italic &&
        last.underline === segment.underline
      ) {
        last.text += segment.text;
      } else {
        mergedSegments.push({ ...segment });
      }
    });

    setSegments(mergedSegments);
    prevSegmentsRef.current = mergedSegments; // Update ref immediately

    // Update the input value
    const newText = getPlainText(mergedSegments);
    input.value = newText;

    // Immediately notify parent of formatting change (before setTimeout)
    if (onFormattingChangeRef.current) {
      onFormattingChangeRef.current(name, mergedSegments);
    }

    // Restore selection
    setTimeout(() => {
      input.setSelectionRange(start, end);
      setSelectionStart(start);
      setSelectionEnd(end);
      // Clear flag after formatting is applied
      isApplyingFormatting.current = false;
    }, 0);

    // Notify parent of change
    if (onChange) {
      onChange({
        target: {
          name,
          value: newText,
          formatting: mergedSegments,
        },
      });
    }
  };

  // Check if selected text has specific formatting
  const hasFormatting = (formatType) => {
    const input = inputRef.current;
    if (!input) return false;

    // In full-field mode, derive state from the single segment (or nextCharFormatting)
    if (isFullMode) {
      const seg = segments[0];
      if (seg) {
        if (formatType === "bold") return !!seg.bold;
        if (formatType === "italic") return !!seg.italic;
        if (formatType === "underline") return !!seg.underline;
      }
      return !!nextCharFormatting.current[formatType];
    }

    const start = input.selectionStart;
    const end = input.selectionEnd;
    
    // If no selection, check formatting at cursor position or next char formatting
    if (start === end) {
      // Check if next character will have formatting
      if (nextCharFormatting.current[formatType]) return true;
      
      // Check formatting at cursor position
      let currentPos = 0;
      for (const segment of segments) {
        const segmentStart = currentPos;
        const segmentEnd = currentPos + segment.text.length;
        
        if (start >= segmentStart && start <= segmentEnd) {
          if (formatType === "bold" && segment.bold) return true;
          if (formatType === "italic" && segment.italic) return true;
          if (formatType === "underline" && segment.underline) return true;
        }
        currentPos = segmentEnd;
      }
      return false;
    }
    
    // If selection exists, check if ALL selected text has the formatting
    const currentText = getPlainText(segments);
    const selectedText = currentText.substring(start, end);
    if (!selectedText) return false;

    let currentPos = 0;
    let allHaveFormatting = true;
    let hasOverlap = false;
    
    for (const segment of segments) {
      const segmentStart = currentPos;
      const segmentEnd = currentPos + segment.text.length;

      if (segmentStart < end && segmentEnd > start) {
        // This segment overlaps with selection
        hasOverlap = true;
        if (formatType === "bold" && !segment.bold) allHaveFormatting = false;
        if (formatType === "italic" && !segment.italic) allHaveFormatting = false;
        if (formatType === "underline" && !segment.underline) allHaveFormatting = false;
      }

      currentPos = segmentEnd;
    }
    
    return hasOverlap && allHaveFormatting;
  };

  // For author fields: parse by comma and allow individual formatting
  const handleAuthorFormatting = (formatType) => {
    // In full-field mode, ignore per-author logic and toggle whole field
    if (isFullMode) {
      applyFullFieldFormatting(formatType);
      return;
    }

    if (!isAuthorMode) {
      applyFormatting(formatType);
      return;
    }

    const input = inputRef.current;
    if (!input) return;

    const start = input.selectionStart;
    const end = input.selectionEnd;
    const currentText = getPlainText(segments);
    const selectedText = currentText.substring(start, end);

    // Find which author the selection belongs to
    const authors = currentText.split(/,| and /i);
    let authorStart = 0;
    let authorIndex = -1;

    for (let i = 0; i < authors.length; i++) {
      const author = authors[i].trim();
      const authorEnd = authorStart + author.length;

      if (start >= authorStart && end <= authorEnd) {
        authorIndex = i;
        break;
      }

      // Move to next author (account for separator)
      const nextSeparator = currentText.indexOf(",", authorEnd);
      const nextAnd = currentText.toLowerCase().indexOf(" and ", authorEnd);
      let nextPos = currentText.length;
      if (nextSeparator !== -1) nextPos = Math.min(nextPos, nextSeparator);
      if (nextAnd !== -1) nextPos = Math.min(nextPos, nextAnd);
      authorStart = nextPos === currentText.length ? authorEnd : nextPos + (currentText[nextPos] === "," ? 1 : 5);
    }

    if (authorIndex >= 0) {
      // Apply formatting to this specific author
      applyFormatting(formatType);
    } else {
      // Apply to selected text normally
      applyFormatting(formatType);
    }
  };

  // Update callback ref when it changes
  useEffect(() => {
    onFormattingChangeRef.current = onFormattingChange;
  }, [onFormattingChange]);

  // Get current segments for parent component
  const getSegments = () => segments;

  // Expose segments via callback - only call when segments actually change
  useEffect(() => {
    // Skip if not initialized yet (initialization is handled separately)
    if (!isInitializedRef.current) {
      return;
    }
    
    // Only call if segments actually changed (deep comparison)
    const prevSegmentsStr = prevSegmentsRef.current ? JSON.stringify(prevSegmentsRef.current) : null;
    const currentSegmentsStr = segments ? JSON.stringify(segments) : null;
    const segmentsChanged = prevSegmentsStr !== currentSegmentsStr;
    
    if (segmentsChanged && onFormattingChangeRef.current) {
      prevSegmentsRef.current = segments;
      onFormattingChangeRef.current(name, segments);
    }
  }, [segments, name]);

  const currentValue = getPlainText(segments) || value;

  // Parse authors and their formatting for display (only for author fields)
  const getAuthorFormattingInfo = () => {
    if (!isAuthorField || segments.length === 0) return [];
    
    const fullText = getPlainText(segments);
    if (!fullText.trim()) return [];
    
    // Better author parsing - handle "Author1, Author2 and Author3" or "Author1 and Author2"
    const authorMatches = [];
    let currentPos = 0;
    
    // Find all author boundaries (comma or " and ")
    while (currentPos < fullText.length) {
      const commaIndex = fullText.indexOf(",", currentPos);
      const andIndex = fullText.toLowerCase().indexOf(" and ", currentPos);
      
      let nextBoundary = fullText.length;
      if (commaIndex !== -1) nextBoundary = Math.min(nextBoundary, commaIndex);
      if (andIndex !== -1) nextBoundary = Math.min(nextBoundary, andIndex);
      
      if (nextBoundary < fullText.length) {
        const authorText = fullText.substring(currentPos, nextBoundary).trim();
        if (authorText) {
          authorMatches.push({
            text: authorText,
            start: currentPos,
            end: nextBoundary,
          });
        }
        // Move past the separator
        if (commaIndex === nextBoundary) {
          currentPos = nextBoundary + 1;
        } else {
          currentPos = nextBoundary + 5; // " and " length
        }
      } else {
        // Last author
        const authorText = fullText.substring(currentPos).trim();
        if (authorText) {
          authorMatches.push({
            text: authorText,
            start: currentPos,
            end: fullText.length,
          });
        }
        break;
      }
    }
    
    // If no separators found, treat entire text as one author
    if (authorMatches.length === 0 && fullText.trim()) {
      authorMatches.push({
        text: fullText.trim(),
        start: 0,
        end: fullText.length,
      });
    }
    
    // Get formatting for each author
    const authorInfo = authorMatches.map(author => {
      let hasBold = false;
      let hasItalic = false;
      let hasUnderline = false;
      let pos = 0;
      
      for (const segment of segments) {
        const segStart = pos;
        const segEnd = pos + segment.text.length;
        
        // Check if this segment overlaps with the author
        if (segStart < author.end && segEnd > author.start) {
          if (segment.bold) hasBold = true;
          if (segment.italic) hasItalic = true;
          if (segment.underline) hasUnderline = true;
        }
        pos = segEnd;
      }
      
      return {
        name: author.text,
        bold: hasBold,
        italic: hasItalic,
        underline: hasUnderline,
      };
    });
    
    return authorInfo;
  };

  const authorFormattingInfo = isAuthorField ? getAuthorFormattingInfo() : [];

  const fmtBtnClass = (type) => {
    const active = hasFormatting(type);
    return `w-7 h-7 flex items-center justify-center text-xs border rounded-md transition-all ${
      active
        ? "bg-[#0D9488] text-white border-[#0D9488]"
        : "bg-white border-gray-200 text-gray-500 hover:border-gray-400 hover:text-gray-700"
    }`;
  };

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <div className="flex items-center gap-1.5 w-full">
        <input
          ref={inputRef}
          type="text"
          name={name}
          value={currentValue}
          onChange={handleTextChange}
          onSelect={handleSelectionChange}
          placeholder={placeholder}
          className={className || "flex-1 rounded-md outline-none border border-gray-300 bg-white hover:border-gray-900 w-full py-2 px-3 text-sm focus-within:border-[#0D9488] focus-within:ring-1 focus-within:ring-[#0D9488] transition-colors"}
        />
        <div className="flex items-center gap-1 flex-shrink-0">
          <button type="button" onClick={() => handleAuthorFormatting("bold")} className={fmtBtnClass("bold")} title="Bold">
            <span className="font-bold text-[11px]">B</span>
          </button>
          <button type="button" onClick={() => handleAuthorFormatting("italic")} className={fmtBtnClass("italic")} title="Italic">
            <span className="italic text-[11px]">I</span>
          </button>
          <button type="button" onClick={() => handleAuthorFormatting("underline")} className={fmtBtnClass("underline")} title="Underline">
            <span className="underline text-[11px]">U</span>
          </button>
        </div>
      </div>
      
      {isAuthorField && authorFormattingInfo.length > 0 && (
        <div className="flex flex-wrap gap-1.5 text-xs mt-0.5">
          <span className="text-gray-500 text-[11px]">Formatting:</span>
          {authorFormattingInfo.map((author, index) => (
            <div
              key={index}
              className="flex items-center gap-1 px-1.5 py-0.5 bg-gray-50 rounded-md border border-gray-100"
              title={`${author.name} - ${[
                author.bold && "Bold",
                author.italic && "Italic",
                author.underline && "Underline"
              ].filter(Boolean).join(", ") || "No formatting"}`}
            >
              <span className={`text-[11px] text-gray-700 ${author.bold ? "font-bold" : ""} ${author.italic ? "italic" : ""} ${author.underline ? "underline" : ""}`}>
                {author.name}
              </span>
              <div className="flex items-center gap-0.5">
                {author.bold && <span className="px-0.5 py-px bg-[#0D9488] text-white text-[9px] font-bold rounded">B</span>}
                {author.italic && <span className="px-0.5 py-px bg-[#0D9488] text-white text-[9px] italic rounded">I</span>}
                {author.underline && <span className="px-0.5 py-px bg-[#0D9488] text-white text-[9px] underline rounded">U</span>}
                {!author.bold && !author.italic && !author.underline && (
                  <span className="text-gray-300 text-[9px]">—</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      
      {!isAuthorField && segments.length > 0 && segments.some(s => s.bold || s.italic || s.underline) && (
        <div className="text-[11px] text-gray-500 flex items-center gap-1.5 mt-0.5">
          <span className="font-medium">Preview:</span>
          <span className="flex-1 text-gray-700">
            {segments.map((segment, idx) => (
              <span
                key={idx}
                className={`${segment.bold ? "font-bold" : ""} ${segment.italic ? "italic" : ""} ${segment.underline ? "underline" : ""}`}
              >
                {segment.text}
              </span>
            ))}
          </span>
        </div>
      )}
    </div>
  );
}

export default RichTextInput;

