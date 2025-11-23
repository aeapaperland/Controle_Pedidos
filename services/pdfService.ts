
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Order, OrderItem, Product, Transaction } from "../types";

// Placeholder logo (Cake Icon) - Replace with actual Base64 logo if needed
const LOGO_BASE64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAMAAABg3Am1AAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAAnFBMVEUAAAD/ysr/ysr/ysr/ysr/ysr/ysr/ysr/ysr/ysr/ysr/ysr/ysr/ysr/ysr/ysr/ysr/ysr/ysr/ysr/ysr/ysr/ysr/ysr/ysr/ysr/ysr/ysr/ysr/ysr/ysr/ysr/ysr/ysr/ysr/ysr/ysr/ysr/ysr///89VO2VAAAAMXRSTlMAEvwT/Bf8G/we/CL8Jvwr/C/8M/w0/Dj8PPxB/ET8RvxK/E78UfxV/Fn8XPxg/GX8k0rS0wAAAAFiS0dEAIgFHUgAAAAJcEhZcwAADsIAAA7CARUoSoAAAAAHdElNRQfoCw4LKB8jZ4+yAAAAcElEQVRIx+3WQQ6AIAxE0R8K97/kFly4MSY2aqWJbzId8tJQSmt9S/I2HAUAAACfQo/AvAPzDsw7MO/AvAPzDsw7MO/AvAPzDsw7MO/AvAPzDsw7MO/AvAPzDsw7MO/AvAPzDsw7MO/AvAPzDsw7MO/AvAPzDsw7MO/AvAPzDsw7MO/AvAPzDsw78N8VYOML+e4C188h76YAAAAldEVYdGRhdGU6Y3JlYXRlADIwMjQtMTEtMTRUMTE6NDA6MzErMDA6MDA6W+0AAAAldEVYdGRhdGU6bW9kaWZ5ADIwMjQtMTEtMTRUMTE6NDA6MzErMDA6MDCZ2WkFAAAAAElFTkSuQmCC";

export const generateOrderPDF = (order: Order) => {
  // Initialize jsPDF - Note: In some ESM environments, jsPDF is a default export
  const doc = new jsPDF();

  // --- COLORS ---
  const PRIMARY_COLOR = [106, 27, 154]; // Roxo Escuro (Aprox #6a1b9a)
  const SECONDARY_COLOR = [225, 190, 231]; // Lilás Claro (Fundo cabeçalho tabela)

  // --- HEADER ---
  // Logo Image
  try {
    doc.addImage(LOGO_BASE64, 'PNG', 95, 10, 20, 20);
  } catch (e) {
    console.error("Error adding logo to PDF:", e);
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
  
  // Header Info (Right)
  doc.text("Contato: (11) 99999-9999", 195, 15, { align: "right" });

  // Title "ORÇAMENTO"
  doc.setFontSize(16);
  doc.setTextColor(106, 27, 154); // Dark Purple
  doc.text("ORÇAMENTO", 105, 45, { align: "center" });

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
  const dateStr = order.dueDate ? new Date(order.dueDate).toLocaleDateString('pt-BR') : "";
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
  doc.text("Chave PIX: (11) 99999-9999 (CNPJ/CPF)", 18, footerY + 20);

  doc.setFont("helvetica", "bold");
  doc.text("Validade do Orçamento:", 110, footerY + 8);
  doc.setFont("helvetica", "normal");
  doc.text("5 dias úteis.", 110, footerY + 14);

  // Save
  const cleanName = (order.customerName || "cliente").replace(/\s+/g, '_');
  doc.save(`orcamento_${cleanName}.pdf`);
};

export const generateWeeklyReportPDF = (orders: Order[], startDate: Date, endDate: Date) => {
  const doc = new jsPDF({ orientation: 'landscape' });

  const startStr = startDate.toLocaleDateString('pt-BR');
  const endStr = endDate.toLocaleDateString('pt-BR');

  // Title & Date Range
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text("Entregas da Semana", 14, 15);
  
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Período: ${startStr} a ${endStr}`, 14, 22);

  // Columns Definition based on requested Matrix
  const columns = [
    "Temas",
    "Data\nEntrega",
    "Donuts",
    "Pirulitos",
    "CakePop",
    "CupCake",
    "Pão de Mel\n(mini)",
    "Pão de Mel\n(médio)",
    "Pão de Mel\n(palito)",
    "Mod.\nEspeciais (3D)",
    "Biscoitos",
    "Lascas",
    "Obs.:"
  ];

  // Sort by date
  const sortedOrders = [...orders].sort((a, b) => {
     const dateA = new Date(a.dueDate + 'T' + (a.dueTime || '00:00')).getTime();
     const dateB = new Date(b.dueDate + 'T' + (b.dueTime || '00:00')).getTime();
     return dateA - dateB;
  });

  // Process Data
  const body = sortedOrders.map(order => {
      // Initialize counts for this row
      const counts: Record<string, number> = {
          donuts: 0,
          pirulitos: 0,
          cakepop: 0,
          cupcake: 0,
          pdm_mini: 0,
          pdm_medio: 0,
          pdm_palito: 0,
          especiais: 0,
          biscoitos: 0,
          lascas: 0
      };

      order.items.forEach(item => {
          const n = item.name.toLowerCase();
          const q = item.quantity;

          if (n.includes('donut')) counts.donuts += q;
          else if (n.includes('pirulito')) counts.pirulitos += q;
          else if (n.includes('cake pop') || n.includes('cakepop')) counts.cakepop += q;
          else if (n.includes('cupcake')) counts.cupcake += q;
          else if (n.includes('pão de mel') || n.includes('pao de mel')) {
              if (n.includes('mini')) counts.pdm_mini += q;
              else if (n.includes('palito')) counts.pdm_palito += q;
              else counts.pdm_medio += q;
          }
          else if (n.includes('3d') || n.includes('especial') || n.includes('especiais')) counts.especiais += q;
          else if (n.includes('biscoito')) counts.biscoitos += q;
          else if (n.includes('lasca')) counts.lascas += q;
      });

      // Format Date (DD/MM)
      const dateObj = new Date(order.dueDate + 'T00:00:00');
      const dateStr = `${dateObj.getDate().toString().padStart(2, '0')}/${(dateObj.getMonth() + 1).toString().padStart(2, '0')}`;
      
      const themeCell = order.theme + (order.customerName ? `\n(${order.customerName})` : '');

      return [
          themeCell,
          dateStr,
          counts.donuts || '',
          counts.pirulitos || '',
          counts.cakepop || '',
          counts.cupcake || '',
          counts.pdm_mini || '',
          counts.pdm_medio || '',
          counts.pdm_palito || '',
          counts.especiais || '',
          counts.biscoitos || '',
          counts.lascas || '',
          order.notes || ''
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
      fontSize: 9,
      halign: 'center',
      valign: 'middle',
      fontStyle: 'bold'
    },
    styles: {
      fontSize: 8,
      cellPadding: 2,
      overflow: 'linebreak',
      valign: 'middle',
      halign: 'center',
      lineColor: [200, 200, 200],
      lineWidth: 0.1
    },
    columnStyles: {
        0: { cellWidth: 40, halign: 'left' }, // Temas wider and left aligned
        1: { cellWidth: 18 }, // Date
        // Obs column (index 12)
        12: { cellWidth: 'auto', halign: 'left' }
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
  totals: { income: number; expense: number; balance: number }
) => {
  const doc = new jsPDF();
  const startStr = startDate.toLocaleDateString('pt-BR');
  const endStr = endDate.toLocaleDateString('pt-BR');

  // --- HEADER ---
  // Logo Image (Reuse from other reports)
  try {
    doc.addImage(LOGO_BASE64, 'PNG', 14, 10, 15, 15);
  } catch (e) {
    console.error("Error adding logo:", e);
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
  // We'll draw colored boxes for summary
  
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
  const tableBody = Object.keys(categoryData).map(cat => {
      const data = categoryData[cat];
      const net = data.income - data.expense;
      return [
          cat,
          `R$ ${data.income.toFixed(2)}`,
          `R$ ${data.expense.toFixed(2)}`,
          `R$ ${net.toFixed(2)}`
      ];
  });

  // 3. Sort by Net Balance descending (optional, but nice)
  // tableBody.sort ... (skipping for simplicity, keeping categorical order or random)

  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "bold");
  doc.text("Detalhamento por Categoria", 14, 90);

  autoTable(doc, {
    startY: 95,
    head: [['Categoria', 'Receitas', 'Despesas', 'Saldo']],
    body: tableBody,
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

  // Define Colors
  const ROSE_MAIN = [190, 18, 60]; // #be123c (Rose 700)
  const ROSE_LIGHT = [255, 241, 242]; // #fff1f2 (Rose 50)
  const TEXT_DARK = [31, 41, 55]; // #1f2937 (Gray 800)

  // --- Cover Page ---
  doc.setFillColor(ROSE_MAIN[0], ROSE_MAIN[1], ROSE_MAIN[2]);
  doc.rect(0, 0, 210, 297, 'F'); // Full page background

  doc.setTextColor(255, 255, 255);
  // Stylized Title
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
  
  // Header function
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
      // Check if we need a new page
      // A card is approx 55 units height. 
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
  doc.text("(11) 99999-9999", 105, 190, { align: "center" });

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.text("@loja_aea_delicias", 105, 250, { align: "center" });

  if (returnBlob) {
    return doc.output('blob');
  }
  doc.save("catalogo_aea_delicias.pdf");
};

export const generateChristmasCatalogPDF = (returnBlob: boolean = false): Blob | void => {
  const doc = new jsPDF();

  // Colors
  const RED = [190, 18, 60]; // Rose 700
  const GREEN = [21, 128, 61]; // Green 700
  const GOLD = [234, 179, 8]; // Yellow 600

  // --- PAGE 1: COVER ---
  // Background image is complex, will use solid color with decoration
  doc.setFillColor(RED[0], RED[1], RED[2]);
  doc.rect(0, 0, 210, 297, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont("times", "italic");
  doc.setFontSize(40);
  doc.text("Catálogo especial de", 105, 100, { align: "center" });
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(80);
  doc.text("NATAL", 105, 135, { align: "center" });
  
  // Decorative tree representation (simple triangle)
  doc.setFillColor(GOLD[0], GOLD[1], GOLD[2]);
  doc.triangle(105, 160, 85, 220, 125, 220, 'F'); // Simple tree shape
  
  // Logo Circle
  doc.setFillColor(255, 255, 255);
  doc.circle(105, 250, 25, 'F');
  doc.setTextColor(RED[0], RED[1], RED[2]);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("A&A", 105, 248, { align: "center" });
  doc.setFontSize(10);
  doc.text("Delícias", 105, 255, { align: "center" });

  // --- PAGE 2: ITEMS ---
  doc.addPage();
  
  // Background
  doc.setFillColor(255, 250, 240); // Floral white
  doc.rect(0,0,210,297,'F');

  // Helper for Product Card
  const drawProduct = (y: number, title: string, desc: string, price: string, color: number[]) => {
      // Title Box
      doc.setFillColor(color[0], color[1], color[2]);
      doc.roundedRect(20, y, 100, 12, 2, 2, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text(title, 70, y+8, { align: "center" });

      // Desc
      doc.setTextColor(50, 50, 50);
      doc.setFont("times", "italic");
      doc.setFontSize(12);
      const lines = doc.splitTextToSize(desc, 90);
      doc.text(lines, 70, y+22, { align: "center" });

      // Price
      doc.setTextColor(GREEN[0], GREEN[1], GREEN[2]);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text(price, 70, y+22 + (lines.length * 5) + 5, { align: "center" });
      
      // Placeholder Image Box (Right side)
      doc.setDrawColor(200, 200, 200);
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(130, y, 60, 60, 2, 2, 'FD');
      doc.setTextColor(200, 200, 200);
      doc.setFontSize(10);
      doc.text("Foto", 160, y+30, {align: "center"});
  };

  // Item 1
  drawProduct(20, "Casinha de Biscoitos Gingerbread", 
      "Biscoitos amanteigados com especiarias, mel e um toque de laranja decorados em glacê real. Tamanho aproximado da casinha: 12cm.", 
      "R$ 189,00", RED);

  // Item 2
  drawProduct(110, "Guirlanda Gingerbread", 
      "Biscoitos amanteigados com especiarias, mel e um toque de laranja. Tamanho aproximado da guirlanda: 22 cm.", 
      "R$ 89,00", RED);

  // Item 3
  drawProduct(200, "Caixinha Árvore de Natal com Biscoitos Natalinos", 
      "8 mini biscoitos amanteigados sortidos nos sabores: baunilha e gingerbread decorados em glacê real.\nTamanhos dos biscoitos: 4 a 5 cm", 
      "R$ 43,00", RED);


  // --- PAGE 3: MORE ITEMS ---
  doc.addPage();
  doc.setFillColor(255, 250, 240); // Floral white
  doc.rect(0,0,210,297,'F');

  // Item 4
  drawProduct(20, "Cartão Biscoito", 
      "1 Biscoito amanteigado sabor baunilha decorado em glacê real", 
      "R$ 25,00", RED);

  // Item 5
  drawProduct(110, "Biscoito no Saquinho com Tag", 
      "1 Biscoito amanteigado sabor baunilha decorado em glacê real", 
      "R$ 14,50", RED);

  // Item 6
  drawProduct(200, "Trufas Decoradas", 
      "Casca de chocolate nobre ao leite com decoração em pasta americana.\nOpções de recheios:\n• Ganache de chocolate ao leite e caramelo salgado\n• Brigadeiro de pistache\n• Brigadeiro tradicional\n\n*Opção de embalagem individual por mais R$ 3,00", 
      "R$ 19,00", RED);

  // --- PAGE 4: INFO ---
  doc.addPage();
  // Background
  doc.setFillColor(255, 250, 240); 
  doc.rect(0,0,210,297,'F');

  // Encomendas Box
  doc.setFillColor(RED[0], RED[1], RED[2]);
  doc.roundedRect(40, 40, 130, 15, 3, 3, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("Encomendas", 105, 50, { align: "center" });

  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(GOLD[0], GOLD[1], GOLD[2]);
  doc.roundedRect(30, 60, 150, 50, 3, 3, 'FD');
  doc.setTextColor(RED[0], RED[1], RED[2]);
  doc.setFont("times", "italic");
  doc.setFontSize(16);
  doc.text("As encomendas serão aceitas até o dia", 105, 80, { align: "center" });
  doc.text("10 de Dezembro via WhatsApp", 105, 95, { align: "center" });

  // Pagamento Box
  doc.setFillColor(RED[0], RED[1], RED[2]);
  doc.roundedRect(40, 130, 130, 15, 3, 3, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("Pagamento", 105, 140, { align: "center" });

  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(GOLD[0], GOLD[1], GOLD[2]);
  doc.roundedRect(30, 150, 150, 50, 3, 3, 'FD');
  doc.setTextColor(RED[0], RED[1], RED[2]);
  doc.setFont("times", "italic");
  doc.setFontSize(14);
  doc.text("Aceitamos PIX e Cartão de Crédito via", 105, 170, { align: "center" });
  doc.text("link (com taxa da operadora de 5% sobre o valor)", 105, 185, { align: "center" });

  // Contact
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(200, 200, 200);
  doc.roundedRect(50, 230, 110, 30, 5, 5, 'FD');
  doc.setTextColor(GREEN[0], GREEN[1], GREEN[2]);
  doc.setFont("helvetica", "bold");
  doc.text("Solicite seu Orçamento", 105, 245, { align: "center" });
  doc.setTextColor(50, 50, 50);
  doc.setFont("helvetica", "normal");
  doc.text("@loja_aea_delicias", 105, 255, { align: "center" });

  if (returnBlob) {
    return doc.output('blob');
  }
  doc.save("Catalogo_Natal_AEA.pdf");
};

export const generateEasterCatalogPDF = (returnBlob: boolean = false): Blob | void => {
  const doc = new jsPDF();

  // Colors
  const BG_CREAM = [245, 245, 220]; // Beige
  const BROWN = [60, 40, 30]; // Dark Brown
  const PRIMARY_COLOR = [106, 27, 154];
  const PRICE_BG = [230, 210, 190];

  // Helper for Background
  const drawBackground = () => {
    doc.setFillColor(BG_CREAM[0], BG_CREAM[1], BG_CREAM[2]);
    doc.rect(0, 0, 210, 297, 'F');
  };

  // --- PAGE 1: COVER ---
  drawBackground();

  // Logo Circle
  doc.setFillColor(BROWN[0], BROWN[1], BROWN[2]);
  doc.circle(105, 50, 32, 'F');
  doc.setFillColor(255, 200, 220); // Pink inner
  doc.circle(105, 50, 28, 'F');
  doc.setTextColor(BROWN[0], BROWN[1], BROWN[2]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("A&A", 105, 48, { align: "center" });
  doc.setFontSize(10);
  doc.text("Delícias", 105, 56, { align: "center" });

  // Bunny Ears (Simple strokes)
  doc.setLineWidth(3);
  doc.setDrawColor(BROWN[0], BROWN[1], BROWN[2]);
  // Left Ear
  doc.line(85, 100, 75, 60);
  doc.line(75, 60, 95, 100);
  // Right Ear
  doc.line(115, 100, 135, 60);
  doc.line(135, 60, 125, 100);
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(60);
  doc.text("Páscoa", 105, 150, { align: "center" });
  
  doc.setFont("times", "italic");
  doc.setFontSize(40);
  doc.text("Catálogo", 105, 170, { align: "center" });

  doc.setFontSize(14);
  doc.text("@loja_aea_delicias", 105, 270, { align: "center" });

  // --- PAGE 2: OVOS GOURMET ---
  doc.addPage();
  drawBackground();

  doc.setTextColor(BROWN[0], BROWN[1], BROWN[2]);
  doc.setFont("times", "italic");
  doc.setFontSize(30);
  doc.text("Ovos Gourmet", 105, 25, { align: "center" });
  doc.text("Artesanais", 105, 38, { align: "center" });

  let y = 60;
  
  const drawItem = (title: string, desc: string, prices: {weight: string, price: string}[]) => {
    // Title
    doc.setFont("times", "italic");
    doc.setFontSize(18);
    doc.setTextColor(BROWN[0], BROWN[1], BROWN[2]);
    doc.text(title, 105, y, { align: "center" }); 
    
    // Desc
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const lines = doc.splitTextToSize(desc, 140);
    doc.text(lines, 105, y + 8, { align: "center" });
    
    // Prices
    let tagY = y + 10 + (lines.length * 4) + 5;
    let xStart = 105 - ((prices.length * 45) / 2) + 20; 
    
    prices.forEach((p, i) => {
        doc.setFillColor(PRICE_BG[0], PRICE_BG[1], PRICE_BG[2]);
        doc.roundedRect(xStart + (i * 50) - 20, tagY, 40, 12, 2, 2, 'F');
        
        doc.setFont("helvetica", "bold");
        doc.text(p.weight, xStart + (i * 50), tagY + 4, { align: "center" });
        doc.text(p.price, xStart + (i * 50), tagY + 9, { align: "center" });
    });
    
    y = tagY + 25;
  };

  drawItem("Ovo Brownie", 
    "Casca de chocolate nobre ao leite recheado com Brownie e o delicioso doce de leite.", 
    [{weight: "250g", price: "R$ 58,00"}, {weight: "350g", price: "R$ 75,00"}]
  );

  drawItem("Ovo Casadinho", 
    "Casca de chocolate nobre ao leite recheado com ganaches de chocolate ao leite e branco.", 
    [{weight: "250g", price: "R$ 58,00"}, {weight: "350g", price: "R$ 75,00"}]
  );

  drawItem("Ovo Ninho com Nutella", 
    "Casca de chocolate nobre ao leite recheado com brigadeiro de leite Ninho e Nutella.", 
    [{weight: "250g", price: "R$ 62,00"}, {weight: "350g", price: "R$ 79,00"}]
  );

  drawItem("Kit com 3 Mini Ovos", 
    "Mini ovos com 50g cada nos sabores: Brownie, Casadinho e Ninho com Nutella.", 
    [{weight: "Kit", price: "R$ 48,00"}]
  );

  // --- PAGE 3: LINHA KIDS ---
  doc.addPage();
  drawBackground();

  doc.setFont("times", "italic");
  doc.setFontSize(30);
  doc.text("Linha Kids", 105, 25, { align: "center" });

  y = 50;
  
  drawItem("Ovo Guloseimas", 
    "Casca de chocolate nobre ao leite recheado com brigadeiro cremoso e guloseimas Fini.", 
    [{weight: "250g", price: "R$ 65,00"}, {weight: "350g", price: "R$ 76,00"}]
  );

  drawItem("Kit com 2 Mini Ovos", 
    "Mini ovos com 50g cada nos sabores: Ganache chocolate branco com Oreo e Brigadeiro com M&Ms.", 
    [{weight: "Kit", price: "R$ 37,00"}]
  );
  
  drawItem("Pirulito de Chocolate", 
    "Chocolate nobre ao leite ou branco decorado em pasta americana.", 
    [{weight: "Unid.", price: "R$ 14,00"}]
  );

  // --- PAGE 4: INFO ---
  doc.addPage();
  drawBackground();
  
  // Circle Logo at top
  doc.setFillColor(BROWN[0], BROWN[1], BROWN[2]);
  doc.circle(105, 40, 20, 'F');
  
  doc.setFontSize(20);
  doc.text("Formas de Pagamento", 105, 80, { align: "center" });
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text("• Pix", 60, 95);
  doc.text("• Cartão de Crédito (via link)", 60, 105);
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("Encomendas", 105, 130, { align: "center" });
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text("• Faça seu pedido pelo WhatsApp.", 30, 145);
  doc.text("• Encomenda confirmada mediante 50% sinal.", 30, 155);
  doc.text("• Entregamos em SP e ABC (consulte taxa).", 30, 165);
  
  doc.text("** Encomendas aceitas até dia 23/03 **", 105, 200, { align: "center" });
  doc.setFont("helvetica", "bold");
  doc.text("(11) 97124-0356", 105, 210, { align: "center" });

  if (returnBlob) {
    return doc.output('blob');
  }
  doc.save("Catalogo_Pascoa.pdf");
};

export const generateDonutCatalogPDF = (returnBlob: boolean = false): Blob | void => {
  const doc = new jsPDF();
  
  const PINK = [255, 200, 210];
  const CHOCO = [60, 30, 20];
  const TEXT_PINK = [200, 50, 100];

  const drawMelt = () => {
    doc.setFillColor(CHOCO[0], CHOCO[1], CHOCO[2]);
    doc.rect(0, 0, 210, 15, 'F');
    for(let i=0; i<=21; i++) {
        doc.circle(i*10, 15, 6, 'F');
    }
  };
  
  const drawPageBg = () => {
      doc.setFillColor(PINK[0], PINK[1], PINK[2]);
      doc.rect(0, 0, 210, 297, 'F');
  }

  // --- P1 Cover ---
  drawPageBg();
  drawMelt();
  
  doc.setTextColor(TEXT_PINK[0], TEXT_PINK[1], TEXT_PINK[2]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(50);
  doc.text("CATÁLOGO", 105, 120, { align: "center" });
  
  doc.setTextColor(CHOCO[0], CHOCO[1], CHOCO[2]);
  doc.setFont("times", "italic");
  doc.setFontSize(18);
  doc.text("Delícias artesanais feitas com carinho", 105, 140, { align: "center" });

  // --- P2 Mini Donuts ---
  doc.addPage();
  drawPageBg();
  drawMelt();

  doc.setTextColor(TEXT_PINK[0], TEXT_PINK[1], TEXT_PINK[2]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(35);
  doc.text("MINI DONUTS", 105, 60, { align: "center" });
  
  doc.setFont("times", "italic");
  doc.setTextColor(CHOCO[0], CHOCO[1], CHOCO[2]);
  doc.setFontSize(18);
  doc.text("Personalizados no tema desejado", 105, 75, { align: "center" });
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.text("Cobertura de chocolate com recheio de doce de leite ou nutella", 105, 90, { align: "center" });
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("R$ 5,85 a unidade", 105, 110, { align: "center" });

  // --- P3 Mini Donuts Box ---
  doc.addPage();
  drawPageBg();
  drawMelt();

  doc.setTextColor(TEXT_PINK[0], TEXT_PINK[1], TEXT_PINK[2]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(30);
  doc.text("MINI DONUTS NA CAIXINHA", 105, 60, { align: "center" });
  
  doc.setFillColor(180, 80, 80); // Darker pink/red box
  doc.roundedRect(20, 100, 170, 50, 5, 5, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.text("CAIXINHA COM 2 MINI DONUTS   R$ 18,50", 105, 120, { align: "center" });
  doc.text("CAIXINHA COM 9 MINI DONUTS   R$ 54,00", 105, 140, { align: "center" });

  // --- P4 Cake Pop ---
  doc.addPage();
  drawPageBg();
  drawMelt();
  
  doc.setTextColor(TEXT_PINK[0], TEXT_PINK[1], TEXT_PINK[2]);
  doc.setFontSize(35);
  doc.text("CAKE POP", 105, 60, { align: "center" });
  doc.setTextColor(CHOCO[0], CHOCO[1], CHOCO[2]);
  doc.setFont("times", "italic");
  doc.setFontSize(18);
  doc.text("Bolinhos decorados cobertos com chocolate", 105, 75, { align: "center" });
  doc.setFont("helvetica", "bold");
  doc.text("R$ 17,00 unidade", 105, 100, { align: "center" });

  // --- P5 Cupcake ---
  doc.addPage();
  drawPageBg();
  drawMelt();

  doc.setTextColor(TEXT_PINK[0], TEXT_PINK[1], TEXT_PINK[2]);
  doc.setFontSize(35);
  doc.text("CUPCAKE", 105, 60, { align: "center" });
  doc.setTextColor(CHOCO[0], CHOCO[1], CHOCO[2]);
  doc.setFont("times", "italic");
  doc.setFontSize(18);
  doc.text("Sabor chocolate recheado com ganache ou brigadeiro", 105, 75, { align: "center" });
  doc.setFont("helvetica", "bold");
  doc.text("Decorados em pasta americana: R$ 19,00", 105, 100, { align: "center" });
  doc.text("Decoração em 3D: A partir de R$ 29,50", 105, 115, { align: "center" });

  // --- P6 Trufas & Pao de Mel (Combined for brevity) ---
  doc.addPage();
  drawPageBg();
  drawMelt();
  
  doc.setTextColor(TEXT_PINK[0], TEXT_PINK[1], TEXT_PINK[2]);
  doc.setFontSize(30);
  doc.text("TRUFAS & PÃO DE MEL", 105, 60, { align: "center" });
  
  doc.setTextColor(CHOCO[0], CHOCO[1], CHOCO[2]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("Trufas (Ganache/Brigadeiro): R$ 16,00", 105, 90, { align: "center" });
  doc.text("Pão de Mel no Palito: R$ 25,00", 105, 110, { align: "center" });
  doc.text("Mini Pão de Mel: R$ 19,50", 105, 130, { align: "center" });

  // --- Last Page Info ---
  doc.addPage();
  drawPageBg();
  drawMelt();
  
  doc.setTextColor(TEXT_PINK[0], TEXT_PINK[1], TEXT_PINK[2]);
  doc.setFontSize(30);
  doc.text("INFORMAÇÕES", 105, 80, { align: "center" });
  
  doc.setTextColor(CHOCO[0], CHOCO[1], CHOCO[2]);
  doc.setFontSize(12);
  doc.text("• Pedidos pelo WhatsApp.", 40, 110);
  doc.text("• 50% entrada, 50% na entrega.", 40, 125);
  doc.text("• Taxa de entrega sob consulta (SP e ABC).", 40, 140);
  
  doc.setFontSize(20);
  doc.text("(11) 97124-0356", 105, 200, { align: "center" });
  doc.text("@loja_aea_delicias", 105, 220, { align: "center" });

  if (returnBlob) {
    return doc.output('blob');
  }
  doc.save("Catalogo_Doces_Rosa.pdf");
};