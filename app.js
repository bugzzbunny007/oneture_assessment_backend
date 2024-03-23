const express = require('express');
const axios = require('axios');
const XLSX = require('xlsx');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 8080;

const API_URL = 'https://aws.amazon.com/api/dirs/items/search';

app.use(express.json());

app.use(cors());

// Fetch data from the API
const fetchDataFromAPI = async (pageNumber, size) => {
  try {
    const response = await axios.get(API_URL, {
      params: {
        'item.directoryId': 'customer-references',
        sort_by: 'item.additionalFields.sortDate',
        sort_order: 'desc',
        size: size,
        'item.locale': 'en_US',
        'tags.id': 'GLOBAL#industry#financial-services|customer-references#industry#financial-services',
        page: pageNumber
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching data:', error);
    throw error;
  }
};


// Endpoint to fetch data with pagination
app.get('/', async (req, res) => {
  res.json(
    "Welcome to Home page"
  )
});

// Endpoint to fetch data with pagination
app.get('/api/data', async (req, res) => {
  const pageNumber = req.query.pageNumber || 0;
  const pageSize = req.query.size || 15;

  console.log("Thisn is page",req.query.pageNumber);

  try {
    const data = await fetchDataFromAPI(pageNumber, pageSize);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Endpoint to export data to Excel
app.get('/api/export', async (req, res) => {
  console.log("Request received for exporting data to Excel");
  
  const pageNumber = req.query.pageNumber || 0;
  const pageSize = req.query.size || 15;

  try {
    console.log("Fetching data from API...");
    const response = await fetchDataFromAPI(pageNumber, pageSize);
    console.log("Data fetched successfully:", response);
    
    // Convert data to Excel format
    const excelData = response.items.map((item, index) => ([
      index + 1, // Serial number
      item.item.additionalFields['customer-name'],
      item.item.additionalFields.headline,
      item.item.additionalFields.descriptionSummary,
      item.item.additionalFields.headlineUrl,
      item.item.additionalFields.displayLocation,
      item.item.additionalFields.industry
    ]));
    console.log("Data mapped to Excel format:", excelData);

    // Add headers
    const headers = ['Serial Number', 'Name', 'Headline', 'Summary', 'PageURL', 'Location', 'Industry'];
    excelData.unshift(headers);

    const ws = XLSX.utils.aoa_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    
    console.log("Writing Excel file...");
    // Generate Excel file in memory
    const excelBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    console.log("Excel file generated successfully");
    
    // Send the Excel file as response
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="data.xlsx"');
    res.send(excelBuffer);

    console.log("Response sent successfully");
  } catch (error) {
    console.error("Error exporting data to Excel:", error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);

});
