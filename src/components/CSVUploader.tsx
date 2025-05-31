import React, { useState } from 'react';
import { useCSVReader, formatFileSize } from 'react-papaparse';

interface CSVUploaderProps {
  onAddressesLoaded: (addresses: string[], amounts?: string[]) => void;
}

const CSVUploader: React.FC<CSVUploaderProps> = ({ onAddressesLoaded }) => {
  const { CSVReader } = useCSVReader();
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  interface ParseResult {
    data: string[][];
    errors: Array<{
      type: string;
      code: string;
      message: string;
      row: number;
    }>;
    meta: {
      aborted: boolean;
      cursor: number;
      delimiter: string;
      linebreak: string;
      truncated: boolean;
    };
  }

  const handleUpload = (results: ParseResult) => {
    try {
      const rows = results.data;
      
      // Filter out empty rows
      const filteredRows = rows.filter((row: string[]) => 
        row.length > 0 && row.some((cell: string) => cell.trim() !== '')
      );
      
      if (filteredRows.length === 0) {
        setUploadStatus('error');
        setErrorMessage('CSV file is empty or contains no valid data');
        return;
      }

      // Check if we have a header row
      const firstRow = filteredRows[0];
      const hasHeader = firstRow.some((cell: string) => 
        cell.toLowerCase().includes('address') || cell.toLowerCase().includes('amount')
      );

      // Start from index 1 if we have a header, otherwise start from 0
      const startIndex = hasHeader ? 1 : 0;
      
      // Extract addresses and amounts
      const addresses: string[] = [];
      const amounts: string[] = [];
      
      for (let i = startIndex; i < filteredRows.length; i++) {
        const row = filteredRows[i];
        
        // If row has at least one column with data
        if (row.length > 0 && row[0].trim() !== '') {
          addresses.push(row[0].trim());
          
          // If there's a second column, it's probably the amount
          if (row.length > 1 && row[1].trim() !== '') {
            amounts.push(row[1].trim());
          } else {
            // If no amount specified, push empty string
            amounts.push('');
          }
        }
      }
      
      if (addresses.length === 0) {
        setUploadStatus('error');
        setErrorMessage('No valid addresses found in the CSV file');
        return;
      }
      
      // Call the callback with the extracted data
      onAddressesLoaded(addresses, amounts);
      setUploadStatus('success');
    } catch (error) {
      console.error('Error parsing CSV:', error);
      setUploadStatus('error');
      setErrorMessage('Failed to parse CSV file. Please check the format.');
    }
  };

  return (
    <div className="csv-uploader">
      <CSVReader
        onUploadAccepted={handleUpload}
        config={{ worker: true }}
        noDrag
      >
        {({
          getRootProps,
          acceptedFile,
          ProgressBar,
          getRemoveFileProps,
          Remove,
        }: {
          getRootProps: () => Record<string, unknown>;
          acceptedFile: File | null;
          ProgressBar: React.FC;
          getRemoveFileProps: () => Record<string, unknown>;
          Remove: React.FC<{ color?: string }>;
        }) => (
          <>
            <div {...getRootProps()} className="csv-upload-area">
              {acceptedFile ? (
                <div className="file-info">
                  <div className="file-details">
                    <p className="file-name">{acceptedFile.name}</p>
                    <span className="file-size">{formatFileSize(acceptedFile.size)}</span>
                  </div>
                  <div className="upload-progress">
                    <ProgressBar />
                  </div>
                  <div {...getRemoveFileProps()} className="remove-file">
                    <Remove />
                  </div>
                </div>
              ) : (
                <div className="upload-prompt">
                  <svg className="upload-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z" />
                  </svg>
                  <p>Upload CSV with addresses</p>
                  <span className="upload-hint">Format: address,amount (optional)</span>
                </div>
              )}
            </div>
            {uploadStatus === 'success' && (
              <div className="upload-success">
                <p>✓ CSV file loaded successfully</p>
              </div>
            )}
            {uploadStatus === 'error' && (
              <div className="upload-error">
                <p>⚠️ {errorMessage}</p>
              </div>
            )}
          </>
        )}
      </CSVReader>
    </div>
  );
};

export default CSVUploader;
