const swaggerJsdoc = require("swagger-jsdoc");

const options = {
 definition: {
  openapi: "3.0.0",
  info: {
    title: "IEG API",
    version: "1.0.0",
    description: "International Export Gateway API Documentation",
  },

  servers: [
    {
      url: "http://localhost:5000/api/v1",
      description: "Local Server",
    },
  ],

  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
  },

  security: [
    {
      bearerAuth: [],
    },
  ],

  tags: [
    { name: "Authentication", description: "Authentication APIs" },
    { name: "Users", description: "User APIs" },
    { name: "Products", description: "Product APIs" },
    { name: "Orders", description: "Order APIs" },
    { name: "Payments", description: "Payment APIs" },
    { name: "Shipments", description: "Shipment APIs" },
    { name: "Shipping Requests", description: "Shipping Request APIs" },
    { name: "Documents", description: "Document APIs" },
    { name: "Recommendations", description: "Recommendation APIs" },
    { name: "Notifications", description: "Notification APIs" },
    { name: "Messages", description: "Message APIs" },
    { name: "Admin", description: "Admin APIs" },
    { name: "Public", description: "Public APIs" },
    { name: "Verifications", description: "Verification APIs" },
  ],
},

  apis: ["./src/modules/**/*.js"],
};

module.exports = swaggerJsdoc(options);