document.addEventListener("DOMContentLoaded", function () {
    var suggestBox;
  
    function createSuggestBox() {
        var box = document.createElement("div");
        box.className = "suggest-box";
        box.style.position = "fixed";
        box.style.top = "0";
        box.style.left = "0";
        box.style.width = "100%";
        document.body.appendChild(box);
        return box;
      }
  
      function setCaretPosition(input, pos) {
        if (input.setSelectionRange) {
          input.setSelectionRange(pos, pos);
        } else if (input.createTextRange) {
          var range = input.createTextRange();
          range.collapse(true);
          range.moveEnd("character", pos);
          range.moveStart("character", pos);
          range.select();
        }
      }
      
  
    function getCaretPosition(input) {
      if (document.selection) {
        input.focus();
        var range = document.selection.createRange();
        range.moveStart("character", -input.value.length);
        return range.text.length;
      } else if (input.selectionStart || input.selectionStart == "0") {
        return input.selectionStart;
      }
      return 0;
    }
  
    function getLastWord(text) {
      var words = text.split(/\s+/);
      return words[words.length - 1];
    }
  
    function setSuggestions(word) {
        var suggestions = [
          "<!DOCTYPE html>",
          "<html>",
          "  <head>",
          "    <title>",
          "    </title>",
          "    <meta charset='UTF-8'>",
          "    <meta name='viewport' content='width=device-width, initial-scale=1.0'>",
          "    <link rel='stylesheet' href='styles.css'>",
          "  </head>",
          "  <body>",
          "    <header>",
          "      <h1>",
          "      </h1>",
          "      <h2>",
          "      </h2>",
          "      <h3>",
          "      </h3>",
          "      <h4>",
          "      </h4>",
          "      <h5>",
          "      </h5>",
          "      <h6>",
          "      </h6>",
          "    </header>",
          "    <nav>",
          "      <ul>",
          "        <li>",
          "        </li>",
          "      </ul>",
          "    </nav>",
          "    <section>",
          "      <article>",
          "        <h2>",
          "        </h2>",
          "        <p>",
          "        </p>",
          "      </article>",
          "    </section>",
          "    <footer>",
          "      <p>",
          "      </p>",
          "    </footer>",
          "  </body>",
          "</html>"
        ];
        return suggestions.filter(function (value) {
          return value.indexOf(word) !== -1;
        });
            
    }
  
    function handleInput(event) {
        var textarea = event.target;
        var caretPos = getCaretPosition(textarea);
        var lastTypedWord = getLastWord(textarea.value.substring(0, caretPos));
        var suggestions = setSuggestions(lastTypedWord);
      
        if (textarea.value.trim() === "") {
          hideSuggestBox(); // Hide suggest-box when the textarea is empty
        } else if (suggestions.length > 0) {
          showSuggestBox(textarea, caretPos, suggestions);
        } else {
          hideSuggestBox();
        }
      }
      
  
    function handleKeyDown(event) {
      if (event.keyCode === 13 || event.keyCode === 108) {
        var textarea = event.target;
        var caretPos = getCaretPosition(textarea);
        var lastTypedWord = getLastWord(textarea.value.substring(0, caretPos));
        var suggestions = setSuggestions(lastTypedWord);
  
        if (suggestions.length > 0) {
          var suggestedWord = suggestions[0];
          var newText =
            textarea.value.substring(0, caretPos - lastTypedWord.length) +
            suggestedWord +
            textarea.value.substring(caretPos);
          textarea.value = newText;
          hideSuggestBox();
          setCaretPosition(textarea, caretPos - lastTypedWord.length + suggestedWord.length);
          event.preventDefault();
        }
      }
    }
  
    function showSuggestBox(textarea, caretPos, suggestions) {
        if (!suggestBox) {
          suggestBox = createSuggestBox();
        }
      
        var coords = getCaretCoordinates(textarea, caretPos);
      
        // Set the position of suggestBox in front of the cursor
        suggestBox.style.top = coords.top + textarea.offsetTop + window.scrollY + "px";
        suggestBox.style.left = coords.left + textarea.offsetLeft + window.scrollX + "px";
      
        suggestBox.innerHTML = "";
        suggestions.forEach(function (suggestion) {
          var suggestionDiv = document.createElement("div");
          suggestionDiv.className = "suggestion";
          suggestionDiv.textContent = suggestion;
          suggestionDiv.onclick = function () {
            insertSuggestion(textarea, caretPos, suggestion);
          };
          suggestBox.appendChild(suggestionDiv);
        });
      
        // Display the suggestBox
        suggestBox.style.display = "block";
      }
      function hideSuggestBox() {
        if (suggestBox) {
            suggestBox.style.display = "none";
          }
      }
  
    function insertSuggestion(textarea, caretPos, suggestion) {
      var newText =
        textarea.value.substring(0, caretPos - getLastWord(textarea.value).length) +
        suggestion +
        textarea.value.substring(caretPos);
      textarea.value = newText;
      hideSuggestBox();
      setCaretPosition(textarea, caretPos - getLastWord(textarea.value).length + suggestion.length);
    }
  
    function getCaretCoordinates(element, position) {
        var range = document.createRange();
        var sel = window.getSelection();
        range.setStart(element, position);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
        var rect = range.getClientRects()[0];
        return { top: rect.top, left: rect.left };
      }
  
    var textareas = document.querySelectorAll("#htmlEditor, #cssEditor, #jsEditor");
    textareas.forEach(function (textarea) {
      textarea.addEventListener("input", handleInput);
      textarea.addEventListener("keydown", handleKeyDown);
    });
  
    document.addEventListener("click", function (event) {
      var target = event.target;
      if (!target.closest(".suggest-box") && !target.closest("textarea")) {
        hideSuggestBox();
      }
    });
  });
  