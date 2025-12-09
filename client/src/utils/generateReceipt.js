//code for generate a PDF receipt using jsPDF
import jsPDF from "jspdf";

export const generateReceiptPDF = (order) => {
  const doc = new jsPDF();
  
  // Set font
  doc.setFont("helvetica", "bold");
  
  // Title
  doc.setFontSize(20);
  doc.text("Payment Receipt", 105, 20, { align: "center" });
  
  // Company/Business Name
  doc.setFontSize(14);
  doc.setFont("helvetica", "normal");
  doc.text("BukSu EEU", 105, 30, { align: "center" });
  
  // Receipt Details
  let yPosition = 50;
  doc.setFontSize(10);
  
  // Order ID
  doc.setFont("helvetica", "bold");
  doc.text("Order ID:", 20, yPosition);
  doc.setFont("helvetica", "normal");
  doc.text(order._id || "N/A", 60, yPosition);
  
  yPosition += 10;
  doc.setFont("helvetica", "bold");
  doc.text("Order Date:", 20, yPosition);
  doc.setFont("helvetica", "normal");
  const orderDate = new Date(order.orderDate || Date.now());
  doc.text(orderDate.toLocaleDateString(), 60, yPosition);
  

  
  // Customer Information
  yPosition += 15;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Customer Information", 20, yPosition);
  
  yPosition += 10;
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Name:", 20, yPosition);
  doc.setFont("helvetica", "normal");
  doc.text(order.addressInfo?.address || "N/A", 50, yPosition);
  
  yPosition += 10;
  doc.setFont("helvetica", "bold");
  doc.text("Email:", 20, yPosition);
  doc.setFont("helvetica", "normal");
  doc.text(order.addressInfo?.notes || "N/A", 50, yPosition);
  
  yPosition += 10;
  doc.setFont("helvetica", "bold");
  doc.text("Phone:", 20, yPosition);
  doc.setFont("helvetica", "normal");
  doc.text(order.addressInfo?.phone || "N/A", 50, yPosition);
  
  // Order Items
  yPosition += 15;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Order Items", 20, yPosition);
  
  yPosition += 10;
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  
  // Table Header
  doc.text("Item", 20, yPosition);
  doc.text("Qty", 100, yPosition);
  doc.text("Price", 130, yPosition);
  doc.text("Total", 160, yPosition);
  
  // Table Items
  yPosition += 8;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  
  if (order.cartItems && order.cartItems.length > 0) {
    order.cartItems.forEach((item) => {
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }
      
      const itemName = item.title || "Product";
      const quantity = item.quantity || 0;
      const price = item.price || 0;
      const itemTotal = quantity * price;
      
      // Truncate long item names
      const truncatedName = doc.splitTextToSize(itemName, 70);
      doc.text(truncatedName, 20, yPosition);
      doc.text(quantity.toString(), 100, yPosition);
      doc.text(`Peso ${price.toFixed(2)}`, 130, yPosition);
      doc.text(`Peso ${itemTotal.toFixed(2)}`, 160, yPosition);
      
      yPosition += Math.max(8, truncatedName.length * 4);
    });
  } else {
    doc.text("No items", 20, yPosition);
    yPosition += 8;
  }
  
  // Total
  yPosition += 10;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Total Amount:", 100, yPosition);
  doc.text(`Php ${(order.totalAmount || 0).toFixed(2)}`, 160, yPosition);
  
  // Footer
  yPosition += 20;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("Thank you for your purchase!", 105, yPosition, { align: "center" });
  yPosition += 5;
  doc.text("This is a computer-generated receipt.", 105, yPosition, { align: "center" });
  
  // Generate filename
  const fileName = `receipt_${order._id || "order"}_${Date.now()}.pdf`;
  
  // Save the PDF
  doc.save(fileName);
};

