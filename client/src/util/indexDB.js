import * as Papa from 'papaparse';
import * as XLSX from 'xlsx';

const fetchDataFromIndexedDB = (name) => {
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(name, 1);

    request.onerror = (event) => {
      console.error('IndexedDB error:', event.target.error);
      reject(event.target.error);
    };

    request.onsuccess = (event) => {
      const db = event.target.result;

      try {
        const transaction = db.transaction(['data'], 'readonly');
        const objectStore = transaction.objectStore('data');
        const getDataRequest = objectStore.getAll();

        getDataRequest.onsuccess = (event) => {
          const data = event.target.result;
          const dataWithoutId = data.map((innerArray) => {
            const { id, ...rest } = innerArray;
            return rest;
          });
          db.close();
          resolve(dataWithoutId);
        };

        getDataRequest.onerror = (event) => {
          console.error('IndexedDB get data error:', event.target.error);
          db.close();
          reject(event.target.error);
        };

        transaction.onerror = (event) => {
          console.error('IndexedDB transaction error:', event.target.error);
          db.close();
          reject(event.target.error);
        };

        transaction.onabort = (event) => {
          console.warn('IndexedDB transaction aborted:', event.target.error);
          db.close();
          reject(new Error('Transaction was aborted'));
        };

        // Add timeout to prevent hanging transactions
        setTimeout(() => {
          if (!db.objectStoreNames.contains('data')) {
            console.warn('IndexedDB transaction timeout');
            db.close();
            reject(new Error('Transaction timeout'));
          }
        }, 10000); // 10 second timeout
      } catch (error) {
        console.error('Error creating transaction:', error);
        db.close();
        reject(error);
      }
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      if (!db.objectStoreNames.contains('data')) {
        db.createObjectStore('data', { keyPath: 'id', autoIncrement: true });
      }
    };
  });
};

const checkNameExistInIndexedDB = (name) => {
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(name);

    request.onerror = (event) => {
      console.error('IndexedDB error:', event.target.error);
      reject(event.target.error);
    };

    request.onsuccess = (event) => {
      const db = event.target.result;
      db.close();
      resolve(true); // Name exists in IndexedDB
    };

    request.onupgradeneeded = (event) => {
      event.target.result.close();
      resolve(event.oldVersion === 0); // Check if the database doesn't exist
    };
  });
};

const storeDataInIndexedDB = (data, name) => {
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(name, 1);

    request.onerror = (event) => {
      console.error('IndexedDB error:', event.target.error);
      reject(event.target.error);
    };

    request.onsuccess = (event) => {
      const db = event.target.result;

      const transaction = db.transaction(['data'], 'readwrite');
      const objectStore = transaction.objectStore('data');

      transaction.onerror = (event) => {
        console.error('IndexedDB transaction error:', event.target.error);
        reject(event.target.error);
      };

      transaction.oncomplete = () => {
        resolve();
      };

      data.forEach((item) => {
        objectStore.put(item);
      });
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      if (!db.objectStoreNames.contains('data')) {
        db.createObjectStore('data', { keyPath: 'id', autoIncrement: true });
      }
    };
  });
};

const updateDataInIndexedDB = (name, data) => {
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(name, 1);

    request.onerror = (event) => {
      console.error('IndexedDB error:', event.target.error);
      reject(event.target.error);
    };

    request.onsuccess = (event) => {
      const db = event.target.result;

      const transaction = db.transaction(['data'], 'readwrite');
      const objectStore = transaction.objectStore('data');

      // Ulta palta korle remove kore daw
      objectStore.clear();

      transaction.onerror = (event) => {
        console.error('IndexedDB transaction error:', event.target.error);
        reject(event.target.error);
      };

      transaction.oncomplete = () => {
        resolve();
      };

      data.forEach((item) => {
        objectStore.put(item);
      });
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      if (!db.objectStoreNames.contains('data')) {
        db.createObjectStore('data', { keyPath: 'id', autoIncrement: true });
      }
    };
  });
};

const deleteIndexedDB = (name) => {
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.deleteDatabase(name);

    request.onerror = (event) => {
      console.error('Error deleting IndexedDB database:', event.target.error);
      reject(event.target.error);
    };

    request.onsuccess = () => {
      console.log('IndexedDB database deleted successfully');
      resolve();
    };
  });
};

const parseExcel = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const data = new Uint8Array(event.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const sheetData = XLSX.utils.sheet_to_csv(workbook.Sheets[sheetName]);

      let id = 1;
      Papa.parse(sheetData, {
        header: true,
        dynamicTyping: true,
        complete: (results) => {
          let data = [];
          if (results.errors.length > 0) {
            const validData = results.data.filter(
              (_, index) => !results.errors.some((error) => error.row === index)
            );
            data = validData;
          } else data = results.data;

          const temp = data.map((row) => {
            const modifiedRow = { ...row };
            if (modifiedRow[''] || modifiedRow[' ']) {
              modifiedRow[`Unnamed Column ${id}`] = modifiedRow[''];
              delete modifiedRow[''];
            }
            return modifiedRow;
          });
          resolve(temp);
        },
        error: (error) => {
          reject(error);
        },
      });
    };
    reader.readAsArrayBuffer(file);
  });
};

const parseCsv = (file) => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      complete: (results) => {
        let data = [];
        if (results.errors.length > 0) {
          const validData = results.data.filter(
            (_, index) => !results.errors.some((error) => error.row === index)
          );
          data = validData;
        } else data = results.data;

        const temp = data.map((row) => {
          const modifiedRow = { ...row };
          if (modifiedRow['']) {
            modifiedRow[`Unnamed Column`] = modifiedRow[''];
            delete modifiedRow[''];
          }
          return modifiedRow;
        });
        resolve(temp);
      },
      error: (error) => {
        reject(error);
      },
    });
  });
};

function fixMismatchedColumns(parsedData) {
  const maxColumns = Math.max(...parsedData.map((row) => row.length));

  // Align columns for each row
  const alignedData = parsedData.map((row) => {
    if (row.length < maxColumns) {
      // Add empty values or placeholders for missing columns
      const missingColumns = maxColumns - row.length;
      return [...row, ...Array(missingColumns).fill('')];
    } else if (row.length > maxColumns) {
      // Truncate extra columns
      return row.slice(0, maxColumns);
    } else {
      // Row already has the correct column count
      return row;
    }
  });

  return alignedData;
}

// Clear IndexedDB database completely with better error handling
const clearIndexedDB = (name) => {
  return new Promise((resolve, reject) => {
    // First, try to close any existing connections
    const closeExisting = () => {
      try {
        const openRequest = window.indexedDB.open(name, 1);
        openRequest.onsuccess = (event) => {
          const db = event.target.result;
          db.close();
          // Now proceed with deletion
          performDeletion();
        };
        openRequest.onerror = () => {
          // If we can't open, proceed with deletion anyway
          performDeletion();
        };
      } catch (error) {
        // If anything fails, proceed with deletion
        performDeletion();
      }
    };

    const performDeletion = () => {
      const deleteRequest = window.indexedDB.deleteDatabase(name);

      deleteRequest.onerror = (event) => {
        console.error('Error deleting IndexedDB:', event.target?.error);
        reject(event.target?.error || new Error('Unknown deletion error'));
      };

      deleteRequest.onsuccess = (event) => {
        console.log(`IndexedDB database "${name}" deleted successfully`);
        resolve();
      };

      deleteRequest.onblocked = (event) => {
        console.warn(
          `IndexedDB database "${name}" deletion blocked, retrying...`
        );
        // Wait a bit and try again
        setTimeout(() => {
          performDeletion();
        }, 100);
      };
    };

    // Start the process
    closeExisting();
  });
};

// Clear all data from a specific IndexedDB database
const clearDataFromIndexedDB = (name) => {
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(name, 1);

    request.onerror = (event) => {
      console.error('IndexedDB error:', event.target.error);
      reject(event.target.error);
    };

    request.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction(['data'], 'readwrite');
      const objectStore = transaction.objectStore('data');

      const clearRequest = objectStore.clear();

      clearRequest.onsuccess = () => {
        console.log(`IndexedDB data cleared for "${name}"`);
        db.close();
        resolve();
      };

      clearRequest.onerror = (event) => {
        console.error('Error clearing IndexedDB data:', event.target.error);
        db.close();
        reject(event.target.error);
      };
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('data')) {
        db.createObjectStore('data', { keyPath: 'id', autoIncrement: true });
      }
    };
  });
};

// Safely switch between files with proper cache management
const safeFileSwitchWithCache = async (newFileName, oldFileName = null) => {
  try {
    // Step 1: Clear old file cache if provided
    if (oldFileName && oldFileName !== newFileName) {
      try {
        console.log(`🧹 Clearing cache for old file: ${oldFileName}`);
        await clearIndexedDB(oldFileName);
        console.log(`✅ Successfully cleared cache for: ${oldFileName}`);
      } catch (error) {
        console.warn(`⚠️ Failed to clear cache for ${oldFileName}:`, error);
        // Don't throw here, continue with loading new data
      }
    }

    // Step 2: Wait a moment to ensure cleanup is complete
    await new Promise((resolve) => setTimeout(resolve, 200));

    // Step 3: Fetch data for new file
    console.log(`📥 Fetching data for: ${newFileName}`);
    const data = await fetchDataFromIndexedDB(newFileName);
    console.log(
      `📊 Successfully loaded ${data.length} rows for: ${newFileName}`
    );

    return data;
  } catch (error) {
    console.error(`❌ Error in safe file switch for ${newFileName}:`, error);
    throw error;
  }
};

export {
  checkNameExistInIndexedDB,
  clearDataFromIndexedDB,
  clearIndexedDB,
  deleteIndexedDB,
  fetchDataFromIndexedDB,
  fixMismatchedColumns,
  parseCsv,
  parseExcel,
  safeFileSwitchWithCache,
  storeDataInIndexedDB,
  updateDataInIndexedDB,
};
