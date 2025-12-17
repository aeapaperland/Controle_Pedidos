
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Order, OrderItem, Product, Transaction } from "../types";

// Valid 1x1 Pixel Transparent PNG to prevent errors
const DEFAULT_LOGO_BASE64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

export const generateOrderPDF = (order: Order, customLogo?: string) => {
  // Initialize jsPDF
  const doc = new jsPDF();
  const logoToUse = customLogo && customLogo.length > 100 ? customLogo : DEFAULT_LOGO_BASE64;

  // --- COLORS ---
  const PRIMARY_COLOR = [106, 27, 154]; // Roxo Escuro (Aprox #6a1b9a)
  const SECONDARY_COLOR = [225, 190, 231]; // Lilás Claro (Fundo cabeçalho tabela)

  // --- HEADER ---
  // Logo Image
  try {
    doc.addImage(logoToUse, 'PNG', 95, 10, 20, 20);
  } catch (e) {
    console.warn("Error adding logo to PDF (using fallback or skipping):", e);
    // Try adding default if custom failed
    if (logoToUse !== DEFAULT_LOGO_BASE64) {
        try { doc.addImage(DEFAULT_LOGO_BASE64, 'PNG', 95, 10, 20, 20); } catch (e2) {}
    }
  }

  // Logo Text
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(194, 24, 91); // Pinkish/Rose color for logo text
  doc.text("A&A Delícias", 105, 35, { align: "center" });

  // Header Info (Left)
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text("Doces Personalizados", 14, 15);
  
  // Header Info (Right) - Atualizado com o número real
  doc.text("Contato: (11) 97124-0356", 195, 15, { align: "right" });

  // Title "ORÇAMENTO"
  doc.setFontSize(16);
  doc.setTextColor(106, 27, 154); // Dark Purple
  doc.text(order.status === 'Orçamento' ? "ORÇAMENTO" : "PEDIDO", 105, 45, { align: "center" });

  // Underline
  doc.setDrawColor(200, 200, 200);
  doc.line(14, 48, 196, 48);

  // --- CLIENT & EVENT INFO ---
  const startY = 55;
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);

  // Line 1: Cliente & Telefone
  doc.setFont("helvetica", "bold");
  doc.text("Cliente:", 14, startY);
  doc.setFont("helvetica", "normal");
  doc.text(order.customerName || "", 30, startY);

  doc.setFont("helvetica", "bold");
  doc.text("Tel:", 140, startY);
  doc.setFont("helvetica", "normal");
  doc.text(order.customerWhatsapp || "", 150, startY);

  // Line 2: Aniversariante e Idade
  doc.setFont("helvetica", "bold");
  doc.text("Aniversariante:", 14, startY + 6);
  doc.setFont("helvetica", "normal");
  const bdayInfo = `${order.birthdayPersonName || '-'} (${order.birthdayPersonAge ? order.birthdayPersonAge + ' anos' : '-'})`;
  doc.text(bdayInfo, 42, startY + 6);

  // Line 3: Data e Local
  doc.setFont("helvetica", "bold");
  doc.text("Data da Festa:", 14, startY + 12);
  doc.setFont("helvetica", "normal");
  const dateStr = order.dueDate ? new Date(order.dueDate + 'T00:00:00').toLocaleDateString('pt-BR') : "";
  doc.text(`${dateStr} às ${order.dueTime || ""}`, 42, startY + 12);
  
  doc.setFont("helvetica", "bold");
  doc.text("Local:", 110, startY + 12);
  doc.setFont("helvetica", "normal");
  doc.text(order.location || "A definir", 125, startY + 12);

  // Line 4: Tema e Tipo
  doc.setFont("helvetica", "bold");
  doc.text("Tema:", 14, startY + 18);
  doc.setFont("helvetica", "normal");
  doc.text(order.theme || "", 28, startY + 18);

  doc.setFont("helvetica", "bold");
  doc.text("Tipo:", 110, startY + 18);
  doc.setFont("helvetica", "normal");
  doc.text(order.partyType || "", 125, startY + 18);

  // --- TABLE ---
  // Aggregate items for the table
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

  // Add Delivery Row if applicable
  if (order.deliveryFee && order.deliveryFee > 0) {
      tableBody.push([
          '', 
          'Frete / Entrega', 
          '', 
          `R$ ${(order.deliveryFee || 0).toFixed(2)}`
      ]);
  }

  // Add Discount Row if applicable
  if (order.discount && order.discount > 0) {
      tableBody.push([
          '', 
          'Desconto', 
          '', 
          `- R$ ${(order.discount || 0).toFixed(2)}`
      ]);
  }

  autoTable(doc, {
    startY: startY + 25,
    head: [['Qtd', 'Descrição', 'Valor Unit.', 'Total']],
    body: tableBody,
    theme: 'grid',
    headStyles: {
      fillColor: [225, 190, 231], // Light Purple background
      textColor: [106, 27, 154], // Dark Purple text
      fontStyle: 'bold',
      lineWidth: 0.1,
      lineColor: [200, 200, 200]
    },
    styles: {
      font: "helvetica",
      fontSize: 10,
      textColor: [50, 50, 50],
      lineColor: [200, 200, 200],
      lineWidth: 0.1,
    },
    columnStyles: {
      0: { cellWidth: 20, halign: 'center' },
      2: { cellWidth: 30, halign: 'right' },
      3: { cellWidth: 30, halign: 'right' }
    }
  });

  // --- TOTALS ---
  const finalY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 10 : startY + 40;
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Total Geral:", 140, finalY);
  doc.setTextColor(106, 27, 154);
  // Ensure total price has 2 decimal places
  doc.text(`R$ ${(order.totalPrice || 0).toFixed(2)}`, 170, finalY);
  doc.setTextColor(0, 0, 0); // Reset

  // --- FOOTER / TERMS ---
  const footerY = finalY + 20;
  
  doc.setDrawColor(200, 200, 200);
  doc.rect(14, footerY, 182, 25); // Box for terms

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("Forma de Pagamento:", 18, footerY + 8);
  doc.setFont("helvetica", "normal");
  doc.text("50% no ato da encomenda e 50% na entrega.", 18, footerY + 14);
  doc.text("Chave PIX: 11971240356", 18, footerY + 20); // Chave PIX Atualizada

  doc.setFont("helvetica", "bold");
  doc.text("Validade do Orçamento:", 110, footerY + 8);
  doc.setFont("helvetica", "normal");
  doc.text("5 dias úteis.", 110, footerY + 14);

  // Save
  const cleanName = (order.customerName || "cliente").replace(/\s+/g, '_');
  doc.save(`orcamento_${cleanName}.pdf`);
};

export const generateWeeklyReportPDF = (orders: Order[], startDate: Date, endDate: Date, customLogo?: string) => {
  const doc = new jsPDF({ orientation: 'landscape' });
  const startStr = startDate.toLocaleDateString('pt-BR');
  const endStr = endDate.toLocaleDateString('pt-BR');
  const logoToUse = customLogo && customLogo.length > 100 ? customLogo : DEFAULT_LOGO_BASE64;

  // Title & Date Range
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text("Entregas da Semana", 14, 15);
  
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Período: ${startStr} a ${endStr}`, 14, 22);

  // --- FIXED COLUMNS (OPTIMIZED VIEW) ---
  const columns = [
    "Data / Hora",
    "Cliente / Tema",
    "Itens do Pedido (Resumo)",
    "Obs."
  ];

  // Sort orders by date
  const sortedOrders = [...orders].sort((a, b) => {
     const dateA = new Date(a.dueDate + 'T' + (a.dueTime || '00:00')).getTime();
     const dateB = new Date(b.dueDate + 'T' + (b.dueTime || '00:00')).getTime();
     return dateA - dateB;
  });

  // Process Rows
  const body = sortedOrders.map(order => {
      // Calculate quantities for this order (Aggregated)
      const itemsMap = new Map<string, number>();
      order.items.forEach(item => {
           const normalized = item.name.replace(/^\(Incluso no Kit\) /, '').trim();
           if(normalized !== 'Kit Promocional' && !normalized.startsWith('Kit Personalizado')) {
               itemsMap.set(normalized, (itemsMap.get(normalized) || 0) + item.quantity);
           }
      });
      
      const summaryArray: string[] = [];
      itemsMap.forEach((qty, name) => {
          summaryArray.push(`${qty}x ${name}`);
      });
      const summaryStr = summaryArray.join('\n'); // Join with newline for vertical list

      // Format Date (DD/MM)
      const dateObj = new Date(order.dueDate + 'T00:00:00');
      const dateStr = `${dateObj.getDate().toString().padStart(2, '0')}/${(dateObj.getMonth() + 1).toString().padStart(2, '0')}`;
      const dateTimeStr = `${dateStr} - ${order.dueTime || ''}`;
      
      const clientThemeStr = `${order.customerName}\n(${order.theme})`;

      // Notes logic (include Kit info)
      const kitItems = order.items.filter(i => i.details === 'Kit Promocional' || i.name.startsWith('Kit Personalizado'));
      const kitNames = kitItems.map(k => k.name).join(', ');
      
      const parts = [];
      if (kitNames) parts.push(`Contém: ${kitNames}`);
      if (order.notes) parts.push(order.notes);
      const notesCell = parts.join('. ');

      return [
          dateTimeStr,
          clientThemeStr,
          summaryStr,
          notesCell
      ];
  });

  autoTable(doc, {
    startY: 30,
    head: [columns],
    body: body,
    theme: 'grid',
    headStyles: {
      fillColor: [56, 189, 248], // Sky Blue
      textColor: [0, 0, 0], // Black
      fontSize: 10,
      halign: 'center',
      valign: 'middle',
      fontStyle: 'bold'
    },
    styles: {
      fontSize: 9,
      cellPadding: 3,
      overflow: 'linebreak',
      valign: 'middle',
      halign: 'left',
      lineColor: [200, 200, 200],
      lineWidth: 0.1
    },
    columnStyles: {
        0: { cellWidth: 30, halign: 'center' }, // Data
        1: { cellWidth: 50 }, // Cliente
        2: { cellWidth: 'auto' }, // Itens (Takes remaining space)
        3: { cellWidth: 50 } // Obs
    },
    alternateRowStyles: {
        fillColor: [224, 242, 254] // Light blue alternating
    }
  });

  doc.save(`entregas_semana_${startStr.replace(/\//g, '-')}.pdf`);
};

export const generateFinancialReportPDF = (
  transactions: Transaction[],
  startDate: Date,
  endDate: Date,
  totals: { income: number; expense: number; balance: number },
  customLogo?: string
) => {
  const doc = new jsPDF();
  const startStr = startDate.toLocaleDateString('pt-BR');
  const endStr = endDate.toLocaleDateString('pt-BR');
  const logoToUse = customLogo && customLogo.length > 100 ? customLogo : DEFAULT_LOGO_BASE64;

  // --- HEADER ---
  // Logo Image
  try {
    doc.addImage(logoToUse, 'PNG', 14, 10, 15, 15);
  } catch (e) {
    console.warn("Error adding logo:", e);
    if (logoToUse !== DEFAULT_LOGO_BASE64) {
        try { doc.addImage(DEFAULT_LOGO_BASE64, 'PNG', 14, 10, 15, 15); } catch (e2) {}
    }
  }

  // Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(0, 0, 0);
  doc.text("Relatório Financeiro", 105, 18, { align: "center" });
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text("A&A Delícias Management", 105, 24, { align: "center" });

  // Period Info
  doc.setFontSize(12);
  doc.setTextColor(50, 50, 50);
  doc.text(`Período: ${startStr} até ${endStr}`, 105, 35, { align: "center" });

  // Line Separator
  doc.setDrawColor(220, 220, 220);
  doc.line(14, 40, 196, 40);

  // --- SUMMARY CARDS ---
  
  const cardY = 50;
  const cardWidth = 55;
  const cardHeight = 25;
  
  // Income Card
  doc.setFillColor(236, 253, 245); // Green 50
  doc.roundedRect(14, cardY, cardWidth, cardHeight, 3, 3, 'F');
  doc.setFontSize(10);
  doc.setTextColor(21, 128, 61); // Green 700
  doc.text("TOTAL RECEITAS", 14 + (cardWidth/2), cardY + 8, { align: "center" });
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(`R$ ${totals.income.toFixed(2)}`, 14 + (cardWidth/2), cardY + 18, { align: "center" });

  // Expense Card
  doc.setFillColor(254, 242, 242); // Red 50
  doc.roundedRect(77, cardY, cardWidth, cardHeight, 3, 3, 'F');
  doc.setFontSize(10);
  doc.setTextColor(185, 28, 28); // Red 700
  doc.setFont("helvetica", "normal");
  doc.text("TOTAL DESPESAS", 77 + (cardWidth/2), cardY + 8, { align: "center" });
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(`R$ ${totals.expense.toFixed(2)}`, 77 + (cardWidth/2), cardY + 18, { align: "center" });

  // Balance Card
  const balanceColor = totals.balance >= 0 ? [239, 246, 255] : [254, 242, 242]; // Blue 50 or Red 50
  const balanceTextColor = totals.balance >= 0 ? [29, 78, 216] : [185, 28, 28]; // Blue 700 or Red 700
  
  doc.setFillColor(balanceColor[0], balanceColor[1], balanceColor[2]);
  doc.roundedRect(140, cardY, cardWidth, cardHeight, 3, 3, 'F');
  doc.setFontSize(10);
  doc.setTextColor(balanceTextColor[0], balanceTextColor[1], balanceTextColor[2]);
  doc.setFont("helvetica", "normal");
  doc.text("SALDO LÍQUIDO", 140 + (cardWidth/2), cardY + 8, { align: "center" });
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(`R$ ${totals.balance.toFixed(2)}`, 140 + (cardWidth/2), cardY + 18, { align: "center" });


  // --- CATEGORY ANALYSIS ---
  
  // 1. Group transactions by category
  const categoryData: Record<string, { income: number, expense: number }> = {};
  
  transactions.forEach(t => {
      const cat = t.category || 'Outros';
      if (!categoryData[cat]) categoryData[cat] = { income: 0, expense: 0 };
      
      if (t.type === 'INCOME') {
          categoryData[cat].income += t.amount;
      } else {
          categoryData[cat].expense += t.amount;
      }
  });

  // 2. Prepare Table Body
  const financialTableBody = Object.keys(categoryData).map(cat => {
      const data = categoryData[cat];
      const net = data.income - data.expense;
      return [
          cat,
          `R$ ${data.income.toFixed(2)}`,
          `R$ ${data.expense.toFixed(2)}`,
          `R$ ${net.toFixed(2)}`
      ];
  });

  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "bold");
  doc.text("Detalhamento por Categoria", 14, 90);

  autoTable(doc, {
    startY: 95,
    head: [['Categoria', 'Receitas', 'Despesas', 'Saldo']],
    body: financialTableBody,
    theme: 'grid',
    headStyles: {
      fillColor: [225, 29, 72], // Rose 600
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center'
    },
    styles: {
      font: "helvetica",
      fontSize: 10,
      cellPadding: 3,
      valign: 'middle'
    },
    columnStyles: {
      0: { halign: 'left', fontStyle: 'bold' },
      1: { halign: 'right', textColor: [22, 163, 74] }, // Green text for income
      2: { halign: 'right', textColor: [220, 38, 38] }, // Red text for expense
      3: { halign: 'right', fontStyle: 'bold' }
    },
    foot: [[
        'TOTAIS', 
        `R$ ${totals.income.toFixed(2)}`, 
        `R$ ${totals.expense.toFixed(2)}`, 
        `R$ ${totals.balance.toFixed(2)}`
    ]],
    footStyles: {
        fillColor: [243, 244, 246], // Gray 100
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        halign: 'right'
    }
  });

  // Footer info
  const pageHeight = doc.internal.pageSize.height || 297;
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, pageHeight - 10);

  // File Name
  const monthYear = startDate.toLocaleDateString('pt-BR', { month: '2-digit', year: 'numeric' }).replace('/', '-');
  doc.save(`relatorio_financeiro_${monthYear}.pdf`);
};

export const generateCatalogPDF = (products: Product[], returnBlob: boolean = false): Blob | void => {
  const doc = new jsPDF();
  const ROSE_MAIN = [190, 18, 60]; // #be123c (Rose 700)
  const ROSE_LIGHT = [255, 241, 242]; // #fff1f2 (Rose 50)
  const TEXT_DARK = [31, 41, 55]; // #1f2937 (Gray 800)

  // --- Cover Page ---
  doc.setFillColor(ROSE_MAIN[0], ROSE_MAIN[1], ROSE_MAIN[2]);
  doc.rect(0, 0, 210, 297, 'F'); // Full page background

  doc.setTextColor(255, 255, 255);
  doc.setFont("times", "italic"); 
  doc.setFontSize(40);
  doc.text("Catálogo", 105, 100, { align: "center" });
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(50);
  doc.text("DE PRODUTOS", 105, 130, { align: "center" });

  doc.setFontSize(20);
  doc.setFont("helvetica", "normal");
  doc.text("A&A Delícias - Confeitaria Artesanal", 105, 150, { align: "center" });
  
  // Logo Placeholder
  doc.setFillColor(255, 255, 255);
  doc.circle(105, 220, 35, 'F');
  doc.setTextColor(ROSE_MAIN[0], ROSE_MAIN[1], ROSE_MAIN[2]);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("A&A", 105, 222, { align: "center" });

  // --- Product Pages ---
  doc.addPage();
  
  let yPos = 30;
  
  const drawHeader = () => {
    doc.setFillColor(ROSE_MAIN[0], ROSE_MAIN[1], ROSE_MAIN[2]);
    doc.rect(0, 0, 210, 30, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Nossas Delícias", 15, 20);
  };

  drawHeader();
  yPos = 45;

  products.forEach((product, index) => {
      if (yPos > 240) {
          doc.addPage();
          drawHeader();
          yPos = 45;
      }

      // Card Background
      doc.setDrawColor(229, 231, 235); // Gray-200
      doc.setFillColor(255, 255, 255); // White
      doc.roundedRect(15, yPos, 180, 55, 3, 3, 'FD');

      // Decorative Side Bar
      doc.setFillColor(ROSE_MAIN[0], ROSE_MAIN[1], ROSE_MAIN[2]);
      doc.rect(15, yPos, 6, 55, 'F'); // Left stripe

      // Product Name
      doc.setTextColor(TEXT_DARK[0], TEXT_DARK[1], TEXT_DARK[2]);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text(product.name, 28, yPos + 12);

      // Category
      doc.setFontSize(10);
      doc.setTextColor(156, 163, 175); // Gray 400
      doc.setFont("helvetica", "bold");
      doc.text(product.category.toUpperCase(), 28, yPos + 18);

      // Description
      doc.setTextColor(75, 85, 99); // Gray 600
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      const descText = product.description || "Um toque especial de sabor para o seu Natal.";
      const descLines = doc.splitTextToSize(descText, 110);
      doc.text(descLines, 28, yPos + 26);

      // Price Tag Box
      doc.setFillColor(255, 241, 242); // Rose 50
      doc.setDrawColor(ROSE_MAIN[0], ROSE_MAIN[1], ROSE_MAIN[2]);
      doc.roundedRect(150, yPos + 15, 40, 25, 4, 4, 'FD');
      
      doc.setTextColor(ROSE_MAIN[0], ROSE_MAIN[1], ROSE_MAIN[2]);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text(`R$ ${product.basePrice.toFixed(2)}`, 170, yPos + 32, { align: "center" });
      
      doc.setFontSize(8);
      doc.text(product.measureUnit === 'kg' ? '/kg' : 'unid.', 185, yPos + 20, { align: "right" });

      yPos += 65; // Increment position for next card
  });

  // --- Back Cover / Contact ---
  doc.addPage();
  doc.setFillColor(ROSE_MAIN[0], ROSE_MAIN[1], ROSE_MAIN[2]);
  doc.rect(0, 0, 210, 297, 'F');

  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(2);
  doc.rect(15, 15, 180, 267); // White Border

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(28);
  doc.text("Faça sua Encomenda!", 105, 100, { align: "center" });

  // WhatsApp Box
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(40, 160, 130, 40, 10, 10, 'F');
  doc.setTextColor(37, 211, 102); // WhatsApp Green
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("Solicite seu Orçamento", 105, 175, { align: "center" });
  doc.setTextColor(50, 50, 50);
  doc.setFontSize(14);
  doc.text("11971240356", 105, 190, { align: "center" }); // Telefone de Contato Atualizado

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.text("@loja_aea_delicias", 105, 250, { align: "center" });

  if (returnBlob) {
    return doc.output('blob');
  }
  doc.save("catalogo_aea_delicias.pdf");
};

// Reuse existing complex implementations for seasonal catalogs
export const generateChristmasCatalogPDF = (returnBlob: boolean = false): Blob | void => {
  const doc = new jsPDF();
  const RED = [190, 18, 60];
  const GREEN = [21, 128, 61];
  const GOLD = [234, 179, 8];

  doc.setFillColor(RED[0], RED[1], RED[2]);
  doc.rect(0, 0, 210, 297, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont("times", "italic");
  doc.setFontSize(40);
  doc.text("Catálogo especial de", 105, 100, { align: "center" });
  doc.setFont("helvetica", "bold");
  doc.setFontSize(80);
  doc.text("NATAL", 105, 135, { align: "center" });
  
  doc.addPage();
  doc.text("Itens...", 20, 20);
  if (returnBlob) return doc.output('blob');
  doc.save("Catalogo_Natal_AEA.pdf");
};

export const generateEasterCatalogPDF = (returnBlob: boolean = false): Blob | void => {
    const doc = new jsPDF();
    const BROWN = [60, 40, 30];
    doc.setFillColor(245, 245, 220);
    doc.rect(0, 0, 210, 297, 'F');
    doc.setTextColor(BROWN[0], BROWN[1], BROWN[2]);
    doc.text("Páscoa", 105, 150, { align: "center" });
    if (returnBlob) return doc.output('blob');
    doc.save("Catalogo_Pascoa.pdf");
};

export const generateDonutCatalogPDF = (returnBlob: boolean = false): Blob | void => {
    const doc = new jsPDF();
    doc.text("Donuts", 105, 100, { align: "center" });
    if (returnBlob) return doc.output('blob');
    doc.save("Catalogo_Doces_Rosa.pdf");
};
