document.getElementById("generateMarkdownBtn").addEventListener("click", async function() {
  const userPrompt = document.getElementById("aiInput").value;
  if (!userPrompt) {
    alert("Please enter text");
    return;
  }

  const messages = [
    {
      role: "system",
      content: "You are a helpful assistant that generates Markdown presentations. Follow these rules:\n" +
               "- Use '---' on a separate line to indicate a new slide, except the first slide.\n" +
               "- Use '#' for main headings and '##' for subheadings.\n" +
               "- Format images with [](image_url), bold text with **bold**, and bullet lists with '- '."
    },
    {
      role: "user",
      content: `Based on the following content, generate the markdown presentation:\n\n${userPrompt}`
    }
  ];

  try {
    const response = await fetch("https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer api_key" // Replace with your actual API key!!!
      },
      body: JSON.stringify({
        model: "qwen-plus",
        messages: messages,
        temperature: 0.7,
        max_tokens: 2048
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`API Error ${response.status}: ${errorData?.error?.message || JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    console.log("Raw API Response:", data);
    const markdownResult = data?.choices?.[0]?.message?.content || "No response received";
    document.getElementById("mdInput").value = markdownResult;

  } catch (error) {
    console.error("Error details:", error);
    alert(`Error: ${error.message}`);
  }
});

// Load sample markdown from sample_text.txt into the textarea
document.getElementById("useSampleBtn0").addEventListener("click", function(){
  fetch("sample_text.txt")
  .then(response => {
      if (!response.ok) {
          throw new Error("Network response was not ok");
      }
      return response.text();
  })
  .then(text => {
      document.getElementById("aiInput").value = text;
  })
  .catch(err => {
      console.error(err);
      alert("Error loading sample text");
  });
});


// Load sample markdown from example.md into the Markdown textarea
document.getElementById("useSampleBtn1").addEventListener("click", function(){
  fetch("sample_md.md")
  .then(response => {
      if (!response.ok) {
          throw new Error("Network response was not ok");
      }
      return response.text();
  })
  .then(text => {
      document.getElementById("mdInput").value = text;
  })
  .catch(err => {
      console.error(err);
      alert("Error loading sample markdown");
  });
});
