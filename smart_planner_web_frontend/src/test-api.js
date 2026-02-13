// src/test-api.js
export async function testBackendConnection() {
  try {
    console.log("Testing backend connection...");
    
    // Test 1: Health endpoint
    const healthRes = await fetch("http://localhost:8000/health");
    console.log("Health check:", await healthRes.json());
    
    // Test 2: API docs
    const docsRes = await fetch("http://localhost:8000/docs");
    console.log("Docs accessible:", docsRes.ok);
    
    // Test 3: Try registration directly
    const testRes = await fetch("http://localhost:8000/api/v1/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "test@example.com",
        password: "Test123456",
        username: "testuser",
        full_name: "Test User"
      })
    });
    
    console.log("Registration test status:", testRes.status);
    const data = await testRes.json().catch(() => ({}));
    console.log("Registration response:", data);
    
    return { success: true, health: healthRes.ok, docs: docsRes.ok, register: testRes.ok };
  } catch (error) {
    console.error("Backend test failed:", error);
    return { success: false, error: error.message };
  }
}