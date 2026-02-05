
import { Order, OrderItem } from '../types';

export const printerService = {
  printOrder: (order: Order, storeName: string) => {
    // Create a hidden iframe
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.width = '0px';
    iframe.style.height = '0px';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) return;

    // Generate Receipt HTML
    const content = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: 'Courier New', Courier, monospace;
            width: 80mm;
            margin: 0;
            padding: 5px;
            color: black;
            font-size: 12px;
          }
          .header { text-align: center; font-weight: bold; margin-bottom: 10px; }
          .divider { border-top: 1px dashed black; margin: 5px 0; }
          .item { display: flex; justify-content: space-between; margin-bottom: 2px; }
          .total { font-size: 16px; font-weight: bold; text-align: right; margin-top: 10px; }
          .footer { text-align: center; margin-top: 15px; font-size: 10px; }
          .big-text { font-size: 18px; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>${storeName.toUpperCase()}</div>
          <div class="divider"></div>
          <div class="big-text">ORDEN #${order.id.split('-')[1]}</div>
          <div>${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</div>
        </div>

        <div style="margin-bottom: 10px;">
          <strong>Cliente:</strong> ${order.customerName}<br>
          <strong>Pago:</strong> ${order.paymentMethod === 'CASH' ? 'EFECTIVO' : 'TARJETA'}
        </div>

        <div class="divider"></div>

        ${order.items.map((item: OrderItem) => `
          <div class="item">
            <span>${item.quantity}x ${item.name}</span>
            <span>${(item.price * item.quantity).toFixed(2)}</span>
          </div>
          ${item.notes ? `<div style="font-size:10px; font-style:italic;">* ${item.notes}</div>` : ''}
        `).join('')}

        <div class="divider"></div>

        <div class="total">TOTAL: €${order.total.toFixed(2)}</div>
        
        <div class="footer">
          <p>¡Gracias por su compra!</p>
          <p>ComandesJa System</p>
        </div>
      </body>
      </html>
    `;

    doc.open();
    doc.write(content);
    doc.close();

    // Trigger Print
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();

    // Cleanup after printing (delay to ensure print dialog opens)
    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 2000);
  }
};
