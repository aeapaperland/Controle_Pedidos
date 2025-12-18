
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Order, OrderItem, Product, Transaction } from "../types";

// Valid 1x1 Pixel Transparent PNG to prevent errors
const DEFAULT_LOGO_BASE64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

// Helper to draw product cards in a themed way
const drawProductCards = (doc: jsPDF, products: Product[], themeColor: number[], startY: number) => {
  const TEXT_DARK = [31, 41, 55];
  let yPos = startY;

  const drawHeader = () => {
    doc.setFillColor(themeColor[0], themeColor[1], themeColor[2]);
    doc.rect(0, 0, 210, 30, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Nossas Delícias", 15, 20);
  };

  products.forEach((product) => {
    if (yPos > 240) {
      doc.addPage();
      drawHeader();
      yPos = 45;
    }

    // Card Background
    doc.setDrawColor(229, 231, 235);
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(15, yPos, 180, 55, 3, 3, 'FD');

    // Decorative Side Bar
    doc.setFillColor(themeColor[0], themeColor[1], themeColor[2]);
    doc.rect(15, yPos, 6, 55, 'F');

    // Product Name
    doc.setTextColor(TEXT_DARK[0], TEXT_DARK[1], TEXT_DARK[2]);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text(product.name, 28, yPos + 12);

    // Category
    doc.setFontSize(10);
    doc.setTextColor(156, 163, 175);
    doc.setFont("helvetica", "bold");
    doc.text(product.category.toUpperCase(), 28, yPos + 18);

    // Description
    doc.setTextColor(75, 85, 99);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    const descText = product.description || "Produtos artesanais feitos com carinho e ingredientes de alta qualidade.";
    const descLines = doc.splitTextToSize(descText, 110);
    doc.text(descLines, 28, yPos + 26);

    // Price Tag Box
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(themeColor[0], themeColor[1], themeColor[2]);
    doc.roundedRect(150, yPos + 15, 40, 25, 4, 4, 'FD');
    
    doc.setTextColor(themeColor[0], themeColor[1], themeColor[2]);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text(`R$ ${product.basePrice.toFixed(2)}`, 170, yPos + 32, { align: "center" });
    
    doc.setFontSize(8);
    doc.text(product.measureUnit === 'kg' ? '/kg' : 'unid.', 185, yPos + 20, { align: "right" });

    yPos += 65;
  });
};

export const generateOrderPDF = (order: Order, customLogo?: string, returnBlob: boolean = false): Blob | void => {
  const doc = new jsPDF();
  const logoToUse = customLogo && customLogo.length > 100 ? customLogo : DEFAULT_LOGO_BASE64;

  const PRIMARY_COLOR = [106, 27, 154]; 
  
  try {
    doc.addImage(logoToUse, 'PNG', 95, 10, 20, 20);
  } catch (e) {
    console.warn("Error adding logo to PDF:", e);
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(194, 24, 91);
  doc.text("A&A Delícias", 105, 35, { align: "center" });

  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text("Doces Personalizados", 14, 15);
  doc.text("Contato: (11) 97124-0356", 195, 15, { align: "right" });

  doc.setFontSize(16);
  doc.setTextColor(106, 27, 154);
  doc.text(order.status === 'Orçamento' ? "ORÇAMENTO" : "PEDIDO", 105, 45, { align: "center" });

  doc.setDrawColor(200, 200, 200);
  doc.line(14, 48, 196, 48);

  const startY = 55;
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);

  doc.setFont("helvetica", "bold");
  doc.text("Cliente:", 14, startY);
  doc.setFont("helvetica", "normal");
  doc.text(order.customerName || "", 30, startY);

  doc.setFont("helvetica", "bold");
  doc.text("Tel:", 140, startY);
  doc.setFont("helvetica", "normal");
  doc.text(order.customerWhatsapp || "", 150, startY);

  doc.setFont("helvetica", "bold");
  doc.text("Aniversariante:", 14, startY + 6);
  doc.setFont("helvetica", "normal");
  const bdayInfo = `${order.birthdayPersonName || '-'} (${order.birthdayPersonAge ? order.birthdayPersonAge + ' anos' : '-'})`;
  doc.text(bdayInfo, 42, startY + 6);

  doc.setFont("helvetica", "bold");
  doc.text("Data da Festa:", 14, startY + 12);
  doc.setFont("helvetica", "normal");
  const dateStr = order.dueDate ? new Date(order.dueDate + 'T00:00:00').toLocaleDateString('pt-BR') : "";
  doc.text(`${dateStr} às ${order.dueTime || ""}`, 42, startY + 12);
  
  doc.setFont("helvetica", "bold");
  doc.text("Local:", 110, startY + 12);
  doc.setFont("helvetica", "normal");
  doc.text(order.location || "A definir", 125, startY + 12);

  doc.setFont("helvetica", "bold");
  doc.text("Tema:", 14, startY + 18);
  doc.setFont("helvetica", "normal");
  doc.text(order.theme || "", 28, startY + 18);

  doc.setFont("helvetica", "bold");
  doc.text("Tipo:", 110, startY + 18);
  doc.setFont("helvetica", "normal");
  doc.text(order.partyType || "", 125, startY + 18);

  const aggregatedItemsMap = new Map<string, OrderItem>();
  (order.items || []).forEach(item => {
      const key = `${item.productId}-${item.details || ''}`;
      if (aggregatedItemsMap.has(key)) {
          const existing = aggregatedItemsMap.get(key)!;
          existing.quantity += item.quantity;
      } else {
          aggregatedItemsMap.set(key, { ...item });
      }
  });
  const displayItems = Array.from(aggregatedItemsMap.values());

  const tableBody: any[] = displayItems.map(item => [
    `${item.quantity} ${item.measureUnit || 'un'}`,
    item.name,
    `R$ ${item.unitPrice.toFixed(2)}`,
    `R$ ${(item.quantity * item.unitPrice).toFixed(2)}`
  ]);

  if (order.deliveryFee && order.deliveryFee > 0) {
      tableBody.push(['', 'Frete / Entrega', '', `R$ ${(order.deliveryFee || 0).toFixed(2)}`]);
  }
  if (order.discount && order.discount > 0) {
      tableBody.push(['', 'Desconto', '', `- R$ ${(order.discount || 0).toFixed(2)}`]);
  }

  autoTable(doc, {
    startY: startY + 25,
    head: [['Qtd', 'Descrição', 'Valor Unit.', 'Total']],
    body: tableBody,
    theme: 'grid',
    headStyles: {
      fillColor: [225, 190, 231],
      textColor: [106, 27, 154],
      fontStyle: 'bold',
    },
    styles: {
      font: "helvetica",
      fontSize: 10,
    },
    columnStyles: {
      0: { cellWidth: 20, halign: 'center' },
      2: { cellWidth: 30, halign: 'right' },
      3: { cellWidth: 30, halign: 'right' }
    }
  });

  const finalY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 10 : startY + 40;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Total Geral:", 140, finalY);
  doc.setTextColor(106, 27, 154);
  doc.text(`R$ ${(order.totalPrice || 0).toFixed(2)}`, 170, finalY);

  const footerY = finalY + 20;
  doc.setDrawColor(200, 200, 200);
  doc.rect(14, footerY, 182, 25);
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  doc.text("Forma de Pagamento:", 18, footerY + 8);
  doc.setFont("helvetica", "normal");
  doc.text("50% no ato da encomenda e 50% na entrega.", 18, footerY + 14);
  doc.text("Chave PIX: 11971240356", 18, footerY + 20);
  doc.setFont("helvetica", "bold");
  doc.text("Validade do Orçamento:", 110, footerY + 8);
  doc.setFont("helvetica", "normal");
  doc.text("5 dias úteis.", 110, footerY + 14);

  const fileName = `orcamento_${(order.customerName || "cliente").replace(/\s+/g, '_')}.pdf`;
  if (returnBlob) return doc.output('blob');
  doc.save(fileName);
};

export const generateWeeklyReportPDF = (orders: Order[], startDate: Date, endDate: Date, customLogo?: string) => {
  const doc = new jsPDF({ orientation: 'landscape' });
  const startStr = startDate.toLocaleDateString('pt-BR');
  const endStr = endDate.toLocaleDateString('pt-BR');

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("Entregas da Semana", 14, 15);
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Período: ${startStr} a ${endStr}`, 14, 22);

  const body = [...orders].sort((a, b) => {
     const dateA = new Date(a.dueDate + 'T' + (a.dueTime || '00:00')).getTime();
     const dateB = new Date(b.dueDate + 'T' + (b.dueTime || '00:00')).getTime();
     return dateA - dateB;
  }).map(order => {
      const itemsMap = new Map<string, number>();
      order.items.forEach(item => {
           const normalized = item.name.replace(/^\(Incluso no Kit\) /, '').trim();
           if(normalized !== 'Kit Promocional' && !normalized.startsWith('Kit Personalizado')) {
               itemsMap.set(normalized, (itemsMap.get(normalized) || 0) + item.quantity);
           }
      });
      const summaryStr = Array.from(itemsMap.entries()).map(([name, qty]) => `${qty}x ${name}`).join('\n');
      const dateObj = new Date(order.dueDate + 'T00:00:00');
      const dateTimeStr = `${dateObj.getDate().toString().padStart(2, '0')}/${(dateObj.getMonth() + 1).toString().padStart(2, '0')} - ${order.dueTime || ''}`;
      const kitNames = order.items.filter(i => i.details === 'Kit Promocional' || i.name.startsWith('Kit Personalizado')).map(k => k.name).join(', ');
      const notesCell = [kitNames ? `Contém: ${kitNames}` : '', order.notes || ''].filter(Boolean).join('. ');

      return [dateTimeStr, `${order.customerName}\n(${order.theme})`, summaryStr, notesCell];
  });

  autoTable(doc, {
    startY: 30,
    head: [["Data / Hora", "Cliente / Tema", "Itens do Pedido", "Obs."]],
    body: body,
    theme: 'grid',
    headStyles: { fillColor: [56, 189, 248], textColor: [0, 0, 0] },
    columnStyles: { 0: { cellWidth: 30, halign: 'center' }, 1: { cellWidth: 50 }, 3: { cellWidth: 50 } },
  });

  doc.save(`entregas_semana_${startStr.replace(/\//g, '-')}.pdf`);
};

export const generateFinancialReportPDF = (transactions: Transaction[], startDate: Date, endDate: Date, totals: { income: number; expense: number; balance: number }, customLogo?: string) => {
  const doc = new jsPDF();
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Relatório Financeiro", 105, 18, { align: "center" });
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Período: ${startDate.toLocaleDateString('pt-BR')} até ${endDate.toLocaleDateString('pt-BR')}`, 105, 25, { align: "center" });

  autoTable(doc, {
    startY: 40,
    head: [['Resumo', 'Valor']],
    body: [
        ['Total Receitas', `R$ ${totals.income.toFixed(2)}`],
        ['Total Despesas', `R$ ${totals.expense.toFixed(2)}`],
        ['Saldo Líquido', `R$ ${totals.balance.toFixed(2)}`]
    ],
    theme: 'striped'
  });

  doc.save(`financeiro_${startDate.getMonth() + 1}_${startDate.getFullYear()}.pdf`);
};

export const generateCatalogPDF = (products: Product[], returnBlob: boolean = false): Blob | void => {
  const doc = new jsPDF();
  const ROSE_MAIN = [190, 18, 60]; 
  
  // Cover
  doc.setFillColor(ROSE_MAIN[0], ROSE_MAIN[1], ROSE_MAIN[2]);
  doc.rect(0, 0, 210, 297, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont("times", "italic"); doc.setFontSize(40); doc.text("Catálogo", 105, 100, { align: "center" });
  doc.setFont("helvetica", "bold"); doc.setFontSize(50); doc.text("DE PRODUTOS", 105, 130, { align: "center" });
  doc.setFontSize(16); doc.text("A&A Delícias", 105, 150, { align: "center" });

  doc.addPage();
  drawProductCards(doc, products, ROSE_MAIN, 45);

  if (returnBlob) return doc.output('blob');
  doc.save("catalogo_aea_delicias.pdf");
};

export const generateChristmasCatalogPDF = (products: Product[], returnBlob: boolean = false): Blob | void => {
  const doc = new jsPDF();
  const RED = [190, 18, 60];
  
  doc.setFillColor(RED[0], RED[1], RED[2]);
  doc.rect(0, 0, 210, 297, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont("times", "italic"); doc.setFontSize(40); doc.text("Catálogo Especial de", 105, 100, { align: "center" });
  doc.setFont("helvetica", "bold"); doc.setFontSize(80); doc.text("NATAL", 105, 135, { align: "center" });
  
  doc.addPage();
  drawProductCards(doc, products, RED, 45);

  if (returnBlob) return doc.output('blob');
  doc.save("Catalogo_Natal_AEA.pdf");
};

export const generateEasterCatalogPDF = (products: Product[], returnBlob: boolean = false): Blob | void => {
  const doc = new jsPDF();
  const BROWN = [60, 40, 30];
  
  doc.setFillColor(BROWN[0], BROWN[1], BROWN[2]);
  doc.rect(0, 0, 210, 297, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont("times", "italic"); doc.setFontSize(40); doc.text("Delícias de", 105, 100, { align: "center" });
  doc.setFont("helvetica", "bold"); doc.setFontSize(80); doc.text("PÁSCOA", 105, 135, { align: "center" });
  
  doc.addPage();
  drawProductCards(doc, products, BROWN, 45);

  if (returnBlob) return doc.output('blob');
  doc.save("Catalogo_Pascoa_AEA.pdf");
};

export const generateDonutCatalogPDF = (products: Product[], returnBlob: boolean = false): Blob | void => {
  const doc = new jsPDF();
  const PINK = [219, 39, 119]; 
  
  doc.setFillColor(PINK[0], PINK[1], PINK[2]);
  doc.rect(0, 0, 210, 297, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont("times", "italic"); doc.setFontSize(40); doc.text("Catálogo de", 105, 100, { align: "center" });
  doc.setFont("helvetica", "bold"); doc.setFontSize(50); doc.text("PERSONALIZADOS", 105, 130, { align: "center" });
  
  doc.addPage();
  drawProductCards(doc, products, PINK, 45);

  if (returnBlob) return doc.output('blob');
  doc.save("Catalogo_Donuts_AEA.pdf");
};
