
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Order, OrderItem, Product, Transaction } from "../types";

// Logo A&A Delícias (Simulado nas cores da marca)
const LOGO_BASE64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAACXBIWXMAAAsTAAALEwEAmpwYAAAFE0lEQVR4nO2dS2zcVRSGv3H8tJM2adM0j5aW8mh5tjwCpBSkFKhFQYtYILEBsaEbQmzYwIYVCzaICiS2bJAqsQGxQYUEKgUSEqC0QJvSeUzTPOZp5/H433Fm4sR2/JtMxp4jR7Y8987//ufec+/x3DOex+MhIiKSHbYwd60t1B0sC3VfLgt1h8tC3aGyUPcoC3VfLo91h8pj3aHwWPe18Fh3KDzWfS081h0Kj3VfC491h8Jj3dfCY92h8Fj3tfBYdyg81n0tPNYdCo91XwuPdYfCY93XwmPdoeTu0Z6B/v6Wttb6uvq6utqamupqf1Wlv6LcX17u8/nKysp8Xq/H7XG7XU6nw2632Ww2q8VstphNBr3eqNfpdDqNulCj0SgXajQalX83o9FkMllstsI3uVwuj8fj8XjK/eXlfv9/319V6a+pqampra2pq6u92dLU1N/f0z2wd8+u5kQ8FokE/H7fwn83v98XiURiTjQaaW5q2rNrZ8/Anu7uBPy+42fOnu/o6LzU2Xm5q+tK15UrXV1Xrlzp7LzU2Xm+4+TZc/3x+L5dO5qCgQW+yQUCAW80Gtm3a0d//7lzF7qutI8M35yZmZ2bm5+fX1hcWl5ZXVtf39jcuLG1vbO7t39wcHh0fHJ6dn5x6crwjekrV6/1Xb7S2Xnu/PneRDy2c3tzJe/xAqGgNxGP9fX1Xrx0ZWR0bHpmdn5hcWl5ZXVtfWNz68bW9s7u3v7B4dHx8cnp2fnFpctD12eu9l3u6r5w8WJv/9mz8f27WysV8gKBoDe+f3df36Wrr46Mjs3Mzi0sLi2vrK6tr29ubt3Y3tnd298/ODw6Pjk9O7+4dGXo+szVvstXOjovXLzY23/2bCL+7K6K398LhILeRDzWd/HildGx6Zm5haWlldW19Y3NrRvbO7t7+weHR8cnp2fnF5eGrg9d77t8pbPz/IX+3sT+eDy+e1elQ14gFPSmkonsxUuXh0dGZ+fmFxaXltfW1zc2t25s7+zu7R8cHh2fnJ6dX1y6MnR95mrf5SsdnRc+PtuT2B+P79lV0Xt0gVDQm0jE9/Vd6rry6ujY9MzcwtLyymrbP79ubO/s7h0cHB4dn5yenV9cGbo+c7Xvclf3hYvnexP7E/H4nl2VvscLhILeRDzW19d38dKVkdGx6ZnZ+YXFpeWV1bX1jc2tG9s7u3v7B4dHx8cnp2fnF5eGrg9dn7nad/lyZ+f5Cxd7E/vj8X17KhnxAqGgNxGP9e/f13fp6q9Gx2Zm5xaWllfW1jc2t25s7+zu7R8cHh2fnJ6dX1wauj5zre/ylc7O8xcv9ibix/ftrnjEC4SC3kQ8tr+v7+KlKyOjY9Mzc/MLi0vLK6tr6xubWze2d3b39g8Oj45PTs/OLy5dGbo+c7Xvclfn+QsXexP74/H4nl0VjXiBUNAbj8f6L/b1XbxyZXRsemZucWl5ZXVtfWNz68b2zu7e/sHh0fHJ6dn5xaWh60PX+y5f6ew8f+F8b2J/Ir5vT0UjXiAU9Cbisb6+vjcvXh4ZHZudm19YWl5b39jcurG9s7u3f3B4dHxienZ+cenK0PWZq32Xu7o+Pt+b2B+Px+PxigZ8gVDQm0jE+z/q67vU1TUyOjY9M7ewtLyytm7/59f2zu7e/sHh0fHJ6dn5xaWh6zNX+y53dV/o7+tN7E/E4/F4RQO+QChY4b/n+F/h/1Xh/13h/7WwUPflslB3uCzUHSr/WSEiIiIiu81ms91ut9vtdrPZbLVarVar1Wq1Wq1Wq9VqtVqtVqvVarVarVar1Wq1Wq1W6z/yFwGfrgljITAfAAAAAElFTkSuQmCC";

const getBase64FromUrl = async (url: string): Promise<string | null> => {
  if (!url) return null;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 seconds timeout

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) return null;

    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    console.warn("Failed to load image for PDF (timeout or cors):", url);
    return null;
  }
};

export const generateOrderPDF = (order: Order) => {
  const doc = new jsPDF();

  // --- COLORS ---
  const PRIMARY_COLOR = [190, 18, 60]; // Rose 700 (Cor da marca)
  const SECONDARY_COLOR = [225, 190, 231]; // Lilás Claro

  // --- HEADER ---
  try {
    // Logo centralizado e maior
    doc.addImage(LOGO_BASE64, 'PNG', 90, 10, 30, 30);
  } catch (e) {
    console.error("Error adding logo to PDF:", e);
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(190, 18, 60); // Rose
  doc.text("A&A Delícias", 105, 48, { align: "center" });

  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text("Doces Personalizados", 105, 54, { align: "center" });
  doc.text("(11) 99999-9999", 105, 60, { align: "center" });

  doc.setFontSize(16);
  doc.setTextColor(106, 27, 154); // Roxo
  doc.text("PEDIDO / ORÇAMENTO", 105, 75, { align: "center" });

  doc.setDrawColor(200, 200, 200);
  doc.line(14, 78, 196, 78);

  // --- CLIENT & EVENT INFO ---
  const startY = 85;
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
  const dateStr = order.dueDate ? new Date(order.dueDate).toLocaleDateString('pt-BR') : "";
  doc.text(`${dateStr} às ${order.dueTime || ""}`, 42, startY + 12);
  
  doc.setFont("helvetica", "bold");
  doc.text("Local:", 110, startY + 12);
  doc.setFont("helvetica", "normal");
  doc.text(order.location || "A definir", 125, startY + 12);

  doc.setFont("helvetica", "bold");
  doc.text("Tema:", 14, startY + 18);
  doc.setFont("helvetica", "normal");
  doc.text(order.theme || "", 28, startY + 18);

  // --- TABLE ---
  const aggregatedItemsMap = new Map<string, OrderItem>();
  (order.items || []).forEach(item => {
      const key = `${item.productId}-${item.details || ''}-${item.unitPrice}`;
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
    item.unitPrice === 0 ? '(Incluso)' : item.unitPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
    item.unitPrice === 0 ? '-' : (item.quantity * item.unitPrice).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  ]);

  if (order.deliveryFee && order.deliveryFee > 0) {
      tableBody.push([
          '', 
          'Frete / Entrega', 
          '', 
          (order.deliveryFee || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
      ]);
  }
  
  if (order.discount && order.discount > 0) {
      tableBody.push([
          '', 
          'Desconto', 
          '', 
          `- ${(order.discount || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`
      ]);
  }

  autoTable(doc, {
    startY: startY + 25,
    head: [['Qtd', 'Descrição / Item', 'Valor Unit.', 'Total']],
    body: tableBody,
    theme: 'grid',
    headStyles: {
      fillColor: [225, 190, 231],
      textColor: [106, 27, 154],
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
  doc.setTextColor(190, 18, 60); // Rose
  doc.text((order.totalPrice || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), 170, finalY);
  doc.setTextColor(0, 0, 0);

  // --- FOOTER ---
  const footerY = finalY + 20;
  doc.setDrawColor(200, 200, 200);
  doc.rect(14, footerY, 182, 35); 

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("Forma de Pagamento:", 18, footerY + 8);
  doc.setFont("helvetica", "normal");
  doc.text("50% no ato da encomenda e 50% na entrega.", 18, footerY + 14);
  doc.text("Pix (Chave: CNPJ/Celular) ou Cartão de Crédito.", 18, footerY + 20);

  doc.setFont("helvetica", "bold");
  doc.text("Validade do Orçamento:", 110, footerY + 8);
  doc.setFont("helvetica", "normal");
  doc.text("5 dias úteis.", 110, footerY + 14);
  
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text("Obrigada pela preferência! Produzido com amor por A&A Delícias.", 105, footerY + 42, { align: "center" });

  const cleanName = (order.customerName || "cliente").replace(/\s+/g, '_');
  doc.save(`orcamento_${cleanName}.pdf`);
};

export const generateWeeklyReportPDF = (orders: Order[], startDate: Date, endDate: Date) => {
  const doc = new jsPDF({ orientation: 'landscape' });

  const startStr = startDate.toLocaleDateString('pt-BR');
  const endStr = endDate.toLocaleDateString('pt-BR');

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text("Entregas da Semana", 14, 15);
  
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Período: ${startStr} a ${endStr}`, 14, 22);

  const columns = [
    "Temas", "Data\nEntrega", "Donuts", "Pirulitos", "CakePop", "CupCake", 
    "Pão de Mel\n(mini)", "Pão de Mel\n(médio)", "Pão de Mel\n(palito)", 
    "Mod.\nEspeciais (3D)", "Biscoitos", "Lascas", "Obs.:"
  ];

  const sortedOrders = [...orders].sort((a, b) => {
     const dateA = new Date(a.dueDate + 'T' + (a.dueTime || '00:00')).getTime();
     const dateB = new Date(b.dueDate + 'T' + (b.dueTime || '00:00')).getTime();
     return dateA - dateB;
  });

  const body = sortedOrders.map(order => {
      const counts: Record<string, number> = {
          donuts: 0, pirulitos: 0, cakepop: 0, cupcake: 0, pdm_mini: 0, pdm_medio: 0, pdm_palito: 0, especiais: 0, biscoitos: 0, lascas: 0
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
          else if (n.includes('3d') || n.includes('especial')) counts.especiais += q;
          else if (n.includes('biscoito')) counts.biscoitos += q;
          else if (n.includes('lasca')) counts.lascas += q;
      });

      const dateObj = new Date(order.dueDate + 'T00:00:00');
      const dateStr = `${dateObj.getDate().toString().padStart(2, '0')}/${(dateObj.getMonth() + 1).toString().padStart(2, '0')}`;
      const themeCell = order.theme + (order.customerName ? `\n(${order.customerName})` : '');

      return [
          themeCell, dateStr, counts.donuts || '', counts.pirulitos || '', counts.cakepop || '', 
          counts.cupcake || '', counts.pdm_mini || '', counts.pdm_medio || '', counts.pdm_palito || '', 
          counts.especiais || '', counts.biscoitos || '', counts.lascas || '', order.notes || ''
      ];
  });

  autoTable(doc, {
    startY: 30,
    head: [columns],
    body: body,
    theme: 'grid',
    headStyles: {
      fillColor: [56, 189, 248],
      textColor: [0, 0, 0],
      fontSize: 9,
      halign: 'center',
      valign: 'middle',
      fontStyle: 'bold'
    },
    styles: { fontSize: 8, cellPadding: 2, overflow: 'linebreak', valign: 'middle', halign: 'center' },
    columnStyles: { 0: { cellWidth: 40, halign: 'left' }, 1: { cellWidth: 18 }, 12: { cellWidth: 'auto', halign: 'left' } },
    alternateRowStyles: { fillColor: [224, 242, 254] }
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

  try { doc.addImage(LOGO_BASE64, 'PNG', 14, 10, 15, 15); } catch (e) {}

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Relatório Financeiro", 105, 18, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text("A&A Delícias Management", 105, 24, { align: "center" });

  doc.setFontSize(12);
  doc.setTextColor(50, 50, 50);
  doc.text(`Período: ${startStr} até ${endStr}`, 105, 35, { align: "center" });
  doc.line(14, 40, 196, 40);

  const cardY = 50;
  const cardWidth = 55;
  
  // Income
  doc.setFillColor(236, 253, 245);
  doc.roundedRect(14, cardY, cardWidth, 25, 3, 3, 'F');
  doc.setTextColor(21, 128, 61);
  doc.setFontSize(10); doc.text("TOTAL RECEITAS", 14 + (cardWidth/2), cardY + 8, { align: "center" });
  doc.setFontSize(14); doc.setFont("helvetica", "bold"); doc.text(totals.income.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), 14 + (cardWidth/2), cardY + 18, { align: "center" });

  // Expense
  doc.setFillColor(254, 242, 242);
  doc.roundedRect(77, cardY, cardWidth, 25, 3, 3, 'F');
  doc.setTextColor(185, 28, 28);
  doc.setFontSize(10); doc.setFont("helvetica", "normal"); doc.text("TOTAL DESPESAS", 77 + (cardWidth/2), cardY + 8, { align: "center" });
  doc.setFontSize(14); doc.setFont("helvetica", "bold"); doc.text(totals.expense.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), 77 + (cardWidth/2), cardY + 18, { align: "center" });

  // Balance
  const balanceColor = totals.balance >= 0 ? [239, 246, 255] : [254, 242, 242];
  const balanceTextColor = totals.balance >= 0 ? [29, 78, 216] : [185, 28, 28];
  doc.setFillColor(balanceColor[0], balanceColor[1], balanceColor[2]);
  doc.roundedRect(140, cardY, cardWidth, 25, 3, 3, 'F');
  doc.setTextColor(balanceTextColor[0], balanceTextColor[1], balanceTextColor[2]);
  doc.setFontSize(10); doc.setFont("helvetica", "normal"); doc.text("SALDO LÍQUIDO", 140 + (cardWidth/2), cardY + 8, { align: "center" });
  doc.setFontSize(14); doc.setFont("helvetica", "bold"); doc.text(totals.balance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), 140 + (cardWidth/2), cardY + 18, { align: "center" });

  const categoryData: Record<string, { income: number, expense: number }> = {};
  transactions.forEach(t => {
      const cat = t.category || 'Outros';
      if (!categoryData[cat]) categoryData[cat] = { income: 0, expense: 0 };
      if (t.type === 'INCOME') categoryData[cat].income += t.amount;
      else categoryData[cat].expense += t.amount;
  });

  const tableBody = Object.keys(categoryData).map(cat => {
      const data = categoryData[cat];
      return [
        cat, 
        data.income.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), 
        data.expense.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), 
        (data.income - data.expense).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
      ];
  });

  doc.setTextColor(0, 0, 0); doc.text("Detalhamento por Categoria", 14, 90);

  autoTable(doc, {
    startY: 95,
    head: [['Categoria', 'Receitas', 'Despesas', 'Saldo']],
    body: tableBody,
    theme: 'grid',
    headStyles: { fillColor: [225, 29, 72], textColor: [255, 255, 255] },
    foot: [['TOTAIS', totals.income.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), totals.expense.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), totals.balance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })]],
  });

  doc.save(`relatorio_financeiro_${startStr.replace(/\//g, '-')}.pdf`);
};

export const generateCatalogPDF = async (products: Product[], returnBlob: boolean = false): Promise<Blob | void> => {
  const doc = new jsPDF();

  // Load all images first to handle async nature with timeout support
  const productsWithImages = await Promise.all(products.map(async (p) => {
      const base64Img = p.imageUrl ? await getBase64FromUrl(p.imageUrl) : null;
      return { ...p, base64Img };
  }));

  // Define Colors
  const ROSE_MAIN = [190, 18, 60]; // #be123c (Rose 700)
  const TEXT_DARK = [31, 41, 55]; // #1f2937 (Gray 800)

  // --- Cover Page ---
  doc.setFillColor(ROSE_MAIN[0], ROSE_MAIN[1], ROSE_MAIN[2]);
  doc.rect(0, 0, 210, 297, 'F'); 

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

  for (const product of productsWithImages) {
      // Dynamic Height Calculation
      // Text area width approx 100mm (180 width total - 65 image/gap - 10 padding)
      doc.setFontSize(10);
      const descLines = doc.splitTextToSize(product.description || "Consulte detalhes.", 100);
      const descHeight = descLines.length * 5; // 5mm per line spacing
      
      // Minimum height 65, but expand if text is long
      const cardContentHeight = 30 + descHeight + 15; // Title area + text + padding
      const CARD_HEIGHT = Math.max(65, cardContentHeight);
      
      if (yPos + CARD_HEIGHT > 280) {
          doc.addPage();
          drawHeader();
          yPos = 45;
      }

      // Card Background
      doc.setDrawColor(229, 231, 235); // Gray-200
      doc.setFillColor(255, 255, 255); // White
      doc.roundedRect(15, yPos, 180, CARD_HEIGHT, 3, 3, 'FD');

      // Image Area (Left)
      const imgSize = 50;
      if (product.base64Img) {
          try {
            // Centering image vertically in the card if card is tall
            const imgY = yPos + (CARD_HEIGHT - imgSize) / 2;
            // Or keep it top aligned with some padding
            const imgTop = yPos + 7;
            doc.addImage(product.base64Img, 'JPEG', 20, imgTop, imgSize, imgSize, undefined, 'FAST');
          } catch(e) {
            doc.setFillColor(240, 240, 240);
            doc.rect(20, yPos + 7, imgSize, imgSize, 'F');
            doc.setFontSize(8);
            doc.setTextColor(150,150,150);
            doc.text("Sem Foto", 25, yPos + 30);
          }
      } else {
          // Placeholder box
          doc.setFillColor(249, 250, 251); // Gray 50
          doc.roundedRect(20, yPos + 7, imgSize, imgSize, 2, 2, 'F');
          doc.setTextColor(ROSE_MAIN[0], ROSE_MAIN[1], ROSE_MAIN[2]);
          doc.setFontSize(20);
          doc.text("♥", 45, yPos + 35, { align: "center" });
      }

      // Content Area (Right of Image)
      const contentX = 80;
      const textStartY = yPos + 12;
      
      // Category
      doc.setFontSize(9);
      doc.setTextColor(156, 163, 175); // Gray 400
      doc.setFont("helvetica", "bold");
      doc.text(product.category.toUpperCase(), contentX, textStartY);

      // Product Name
      doc.setTextColor(TEXT_DARK[0], TEXT_DARK[1], TEXT_DARK[2]);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text(product.name, contentX, textStartY + 6);

      // Description
      doc.setTextColor(75, 85, 99); // Gray 600
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(descLines, contentX, textStartY + 12);

      // Price Tag (Bottom Right of Card)
      doc.setFillColor(255, 241, 242); // Rose 50
      doc.setDrawColor(ROSE_MAIN[0], ROSE_MAIN[1], ROSE_MAIN[2]);
      
      const priceBoxY = yPos + CARD_HEIGHT - 25;
      doc.roundedRect(150, priceBoxY, 40, 20, 3, 3, 'FD');
      
      doc.setTextColor(ROSE_MAIN[0], ROSE_MAIN[1], ROSE_MAIN[2]);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text(product.basePrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), 170, priceBoxY + 13, { align: "center" });
      
      doc.setFontSize(8);
      doc.text(product.measureUnit === 'kg' ? '/kg' : 'unid.', 185, priceBoxY + 5, { align: "right" });

      yPos += (CARD_HEIGHT + 10);
  }

  // --- Back Cover ---
  doc.addPage();
  doc.setFillColor(ROSE_MAIN[0], ROSE_MAIN[1], ROSE_MAIN[2]);
  doc.rect(0, 0, 210, 297, 'F');

  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(2);
  doc.rect(15, 15, 180, 267); 

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(28);
  doc.text("Faça sua Encomenda!", 105, 100, { align: "center" });

  doc.setFillColor(255, 255, 255);
  doc.roundedRect(40, 160, 130, 40, 10, 10, 'F');
  doc.setTextColor(37, 211, 102); 
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
  const RED = [190, 18, 60]; const GREEN = [21, 128, 61];
  
  doc.setFillColor(RED[0], RED[1], RED[2]); doc.rect(0, 0, 210, 297, 'F');
  doc.setTextColor(255, 255, 255); doc.setFont("times", "italic"); doc.setFontSize(40); doc.text("Catálogo especial de", 105, 100, { align: "center" });
  doc.setFont("helvetica", "bold"); doc.setFontSize(80); doc.text("NATAL", 105, 135, { align: "center" });
  
  doc.addPage(); doc.setFillColor(255, 250, 240); doc.rect(0,0,210,297,'F');
  
  const drawItem = (y: number, title: string, desc: string, price: string) => {
      doc.setFillColor(RED[0], RED[1], RED[2]); doc.roundedRect(20, y, 100, 12, 2, 2, 'F');
      doc.setTextColor(255, 255, 255); doc.setFontSize(12); doc.text(title, 70, y+8, { align: "center" });
      doc.setTextColor(50, 50, 50); doc.setFont("times", "italic"); 
      doc.text(doc.splitTextToSize(desc, 90), 70, y+22, { align: "center" });
      doc.setTextColor(GREEN[0], GREEN[1], GREEN[2]); doc.setFont("helvetica", "bold"); doc.setFontSize(14); doc.text(price, 70, y+50, { align: "center" });
  };

  drawItem(30, "Casinha Gingerbread", "Biscoitos amanteigados com especiarias.", "R$ 189,00");
  drawItem(120, "Guirlanda Gingerbread", "Linda guirlanda comestível.", "R$ 89,00");
  drawItem(210, "Trufas Decoradas", "Recheios variados e decoração 3D.", "R$ 19,00");

  if (returnBlob) return doc.output('blob');
  doc.save("Catalogo_Natal_AEA.pdf");
};

export const generateEasterCatalogPDF = (returnBlob: boolean = false): Blob | void => {
  const doc = new jsPDF();
  doc.text("Catálogo de Páscoa", 105, 20, { align: 'center' });
  if (returnBlob) return doc.output('blob');
  doc.save("Catalogo_Pascoa.pdf");
};

export const generateDonutCatalogPDF = (returnBlob: boolean = false): Blob | void => {
  const doc = new jsPDF();
  doc.text("Catálogo de Donuts", 105, 20, { align: 'center' });
  if (returnBlob) return doc.output('blob');
  doc.save("Catalogo_Donuts.pdf");
};
