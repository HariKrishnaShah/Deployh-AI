const express = require("express");
const router = express.Router();
const multer = require("multer");
const fs = require("fs");
const axios = require("axios");
const FormData = require("form-data");
const pptxgen = require('pptxgenjs');

const formData = new FormData();
formData.append(
  "file",
  fs.createReadStream("./uploads/report.pdf")
);

const options = {
  headers: {
    "x-api-key": "sec_FNSKEAEQkhSeujT0BsvA9WLhLRBUcqN7",
    ...formData.getHeaders(),
  },
};
const config = {
    headers: {
      "x-api-key": "sec_FNSKEAEQkhSeujT0BsvA9WLhLRBUcqN7",
      "Content-Type": "application/json",
    },
  };

let sourceId = "src_QuSHKh5qpa0Mq425vx2uS";
const data = (message)=>{
    return(
        {sourceId: sourceId,
        messages: [
          {
            role: "user",
            content: message,
          },
        ]}
    )
}
    

// Define storage for multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './uploads');
  },
  filename: function (req, file, cb) {
    cb(null, 'report.pdf');
  }
});

// Initialize multer upload with the defined storage
const upload = multer({ storage: storage });

// Define route for file upload
router.post("/fileupload", upload.single('pdf'), async (req, res) => {
  try {
    if (req.file) {
      // If file is uploaded successfully, send success response
      await axios
  .post("https://api.chatpdf.com/v1/sources/add-file", formData, options)
  .then((response) => {
    sourceId = response.data.sourceId;
    console.log("Source ID:", response.data.sourceId);
  })
  .catch((error) => {
    console.log("Error:", error.message);
    console.log("Response:", error.response.data);
  });
      res.status(200).json({ message: "File uploaded successfully." });
    } else {
      // If no file is uploaded, send error response
      res.status(400).json({ error: "No file uploaded." });
    }
  } catch (err) {
    // If any error occurs during file upload, send error response
    console.error(err);
    res.status(500).json({ error: "Internal server error." });
  }
});

router.get("/query/executive/", async(req, res)=>{
    const result = {severity:{highSeverity:0,mediumSeverity:0, lowSeverity:0}, keyFindinds:[], recommendation:"", conclusion:""}

    let response = await axios.post("https://api.chatpdf.com/v1/chats/message", data("Provide bar-chart data about the severity from executive summary"), config);
    // Regular expressions to match numbers
const numberRegex = /\d+/g;

// Function to extract severity breakdown from the response
function extractSeverityBreakdown(response) {
  // Extract numbers from the response content
  const numbers = response.data.content.match(numberRegex);
  
  // Check if numbers were found
  if (numbers) {
    // Extract numbers for each severity level
    const highSeverity = numbers[0];
    result.severity.highSeverity = highSeverity;
    const mediumSeverity = numbers[1];
    result.severity.mediumSeverity = mediumSeverity;
    const lowSeverity = numbers[2];
    result.severity.lowSeverity = lowSeverity;

    // Return an object containing the breakdown
    return {
      highSeverity: parseInt(highSeverity),
      mediumSeverity: parseInt(mediumSeverity),
      lowSeverity: parseInt(lowSeverity)
    };
  } else {
    return null;
  }
}

// Extract severity breakdown from the response
const severityBreakdown = extractSeverityBreakdown(response);

// Log the extracted data
if (severityBreakdown) {
  console.log("High Severity:", severityBreakdown.highSeverity);
  console.log("Medium Severity:", severityBreakdown.mediumSeverity);
  console.log("Low Severity:", severityBreakdown.lowSeverity);
} else {
  console.log("No severity breakdown found in the response.");
}
let response2 = await axios.post("https://api.chatpdf.com/v1/chats/message", data("List the key findings from the executive summary."), config);
const keyFindings = extractKeyFindings(response2.data.content);
// Function to extract key findings from the response
function extractKeyFindings(responseContent) {
    // Split the response content into lines
    const lines = responseContent.split("\n");
  
    // Initialize an array to store key findings
    const keyFindings = [];
  
    // Iterate through each line to find key findings
    lines.forEach((line) => {
      // Check if the line starts with a bullet point
      if (line.trim().startsWith("-")) {
        // Extract the key finding and remove the bullet point
        const keyFinding = line.trim().substring(1).trim();
        // Add the key finding to the array
        keyFindings.push(keyFinding);
      }
    });
  
    // Return the array of key findings
    return keyFindings;
  }

  let response3 = await axios.post("https://api.chatpdf.com/v1/chats/message", data("Develop a recommendation from the file."), config);
  let response4 = await axios.post("https://api.chatpdf.com/v1/chats/message", data("Develop a conclusion of the file."), config);
result.conclusion = response4.data.content;
  result.recommendation = response4.data.content;
    result.keyFindinds=[...keyFindings]
return res.json(result);

})

router.get("/download", async (req, res) => {
    try {

        // Make a GET request to fetch data from the API
        const response = await axios.get("http://localhost:4000/query/executive");

        // Check if the request was successful
        if (response.status === 200) {
            // Extract data from the response
            const data = await response.data;
            let {severity, keyFindinds, recommendation, conclusion} = data;
            keyFindinds = keyFindinds.join('\n');

            // Create a new PowerPoint presentation
            const pptx = new pptxgen();
            let slide = pptx.addSlide();
            // Add a slide with a chart showing severity levels
            const chartData = [
                { name: 'High Severity', labels: ['High Severity'], values: [parseInt(severity.highSeverity)], barColor: 'FF0000' },
                { name: 'Medium Severity', labels: ['Medium Severity'], values: [parseInt(severity.mediumSeverity)], barColor: 'FFA500' },
                { name: 'Low Severity', labels: ['Low Severity'], values: [parseInt(severity.lowSeverity)], barColor: 'FFFF00' }
            ];

            // Add a slide with recommendation and conclusion
            slide.addText(`${keyFindinds}`, {
                x: 0,
                y: 1,
                w: "100%",
                h: 2,
                align: "center",
                color: "0088CC",
                fill: "F1F1F1",
                fontSize: 24,
            });
            slide.addText(`${recommendation}`, {
                x: 0,
                y: 1,
                w: "100%",
                h: 2,
                align: "center",
                color: "0088CC",
                fill: "F1F1F1",
                fontSize: 24,
            });
            slide.addText(`${conclusion}`, {
                x: 0,
                y: 1,
                w: "100%",
                h: 2,
                align: "center",
                color: "0088CC",
                fill: "F1F1F1",
                fontSize: 24,
            });
            // Generate the PPT file
            const pptxBlob = await pptx.writeFile({ fileName: "Final Report" });

            // Set the appropriate headers for the download
            res.setHeader('Content-Disposition', 'attachment; filename=report.pptx');
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.presentationml.presentation');

            // Send the PPT file as a response
            return res.send(pptxBlob);
        } else {
            // Handle the case where the request was not successful
            return res.status(response.status).json({ error: 'Request failed.' });
        }
    } catch (error) {
        // Handle errors
        console.error('Error:', error.message);
        return res.status(500).json({ error: 'Internal server error.' });
    }
});

module.exports = router;
