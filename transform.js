const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const INPUT_FILE = path.join(__dirname, 'data.xlsx');
const OUTPUT_DIR = path.join(__dirname, 'public', 'assets');

if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

function convertByType(value, type) {
    if (value === null || value === undefined || value === '') {
        if (type === 'int' || type === 'integer') {
            return 0;
        } else if (type === 'float' || type === 'double') {
            return 0.0;
        } else if (type === 'bool' || type === 'boolean') {
            return false;
        } else if (type === 'string') {
            return '';
        }
        return null;
    }

    switch (type.toLowerCase()) {
        case 'int':
        case 'integer':
            return parseInt(value, 10);
        case 'float':
        case 'double':
            return parseFloat(value);
        case 'bool':
        case 'boolean':
            const lowerValue = String(value).toLowerCase();
            return lowerValue === 'true' || lowerValue === '1' || lowerValue === 'yes';
        case 'string':
        default:
            return String(value);
    }
}

async function processExcelFile(filePath) {
    console.log(`Processing file: ${filePath}`);

    try {
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (jsonData.length < 4) {
            console.error(`File ${filePath} doesn't have enough rows for conversion.`);
            return;
        }

        const labels = jsonData[1];
        const keys = jsonData[2];
        const types = jsonData[3];
        const dataRows = jsonData.slice(4);

        const columns = [];
        for (let i = 0; i < keys.length; i++) {
            if (keys[i] && !keys[i].startsWith('//')) {
                columns.push({
                    width: 100,
                    key: keys[i],
                    label: labels[i] || keys[i]
                });
            }
        }

        const columnsPath = path.join(OUTPUT_DIR, 'columns.json');
        fs.writeFileSync(columnsPath, JSON.stringify(columns, null, 2), 'utf8');
        console.log(`Successfully created ${columnsPath}`);

        const tableData = [];
        for (let i = 0; i < dataRows.length; i++) {
            const row = dataRows[i];
            const obj = {};

            if (!row || row.every(cell => cell === undefined || cell === null || cell === '')) {
                continue;
            }

            for (let j = 0; j < keys.length; j++) {
                const key = keys[j];
                if (key && !key.startsWith('//')) {
                    const value = row[j];
                    const type = types[j] || 'string';
                    obj[key] = convertByType(value, type);
                }
            }

            if (Object.keys(obj).length > 0) {
                tableData.push(obj);
            }
        }

        const tableDataPath = path.join(OUTPUT_DIR, 'tableData.json');
        fs.writeFileSync(tableDataPath, JSON.stringify(tableData, null, 2), 'utf8');
        console.log(`Successfully created ${tableDataPath}`);

    } catch (error) {
        console.error(`Error processing file ${filePath}:`, error.message);
    }
}

async function main() {
    console.log('Starting Excel to JSON conversion...');
    console.log(`Input file: ${INPUT_FILE}`);
    console.log(`Output directory: ${OUTPUT_DIR}`);

    if (!fs.existsSync(INPUT_FILE)) {
        console.error(`Input file not found: ${INPUT_FILE}`);
        return;
    }

    await processExcelFile(INPUT_FILE);
    console.log('Conversion completed!');
}

// 导出函数，以便在其他文件中调用
module.exports = {
    processExcelFile,
    main
};