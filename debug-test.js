// Simple test to debug the data insertion issue
const testData = {
  masterData: {
    slip_no: 'DEBUG001',
    driver_name: 'Debug Driver',
    first_weight: 1000
  },
  itemsData: []
};

console.log('Test data:', JSON.stringify(testData, null, 2));

const masterData = testData.masterData || testData;
console.log('Extracted masterData:', JSON.stringify(masterData, null, 2));

const slip_no = masterData.slip_no;
const driver_name = masterData.driver_name;
const first_weight = masterData.first_weight;

console.log('Individual values:');
console.log('slip_no:', slip_no);
console.log('driver_name:', driver_name);
console.log('first_weight:', first_weight);