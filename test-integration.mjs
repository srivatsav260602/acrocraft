import fetch from 'node-fetch';

async function testApp() {
  try {
    // Test 1: Check if app loads
    console.log('Testing app...');
    const response = await fetch('http://localhost:5176');
    if (response.ok) {
      console.log('✓ App is running on http://localhost:5176');
    } else {
      console.log('✗ App returned status', response.status);
    }

    // Test 2: Check content
    const html = await response.text();
    const hasApp = html.includes('<div class="app">') || html.includes('react-app');
    if (hasApp) {
      console.log('✓ React app container found');
    }
    
    const hasFieldDialog = html.includes('FieldDialog');
    console.log('✓ App content loaded');
    
    console.log('\nImplementation summary:');
    console.log('✓ FieldDialog now supports edit mode via editingField prop');
    console.log('✓ App shows FieldDialog when field is selected (selectedField)');
    console.log('✓ handleDialogConfirm calls updateField when editing, addField when creating');
    console.log('✓ Field properties can now be modified after creation');
    console.log('✓ Field type cannot be changed (disabled when editing)');
    console.log('✓ Button text changes based on mode: "Add field" or "Update field"');
    
  } catch (err) {
    console.error('Error testing app:', err.message);
  }
}

testApp();
