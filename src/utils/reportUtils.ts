
import { Transaction, ReportFormat } from '@/types';
import { toast } from '@/components/ui/use-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generateReportData = (
  transactions: Transaction[],
  reportType: string,
  startDate: Date | undefined,
  endDate: Date | undefined
): Transaction[] => {
  // Filter transactions by date range
  let filteredTransactions = transactions;
  
  if (startDate && endDate) {
    filteredTransactions = transactions.filter(transaction => {
      const transactionDate = new Date(transaction.date);
      return transactionDate >= startDate && transactionDate <= endDate;
    });
  }
  
  // Further filter by report type
  if (reportType === 'income') {
    filteredTransactions = filteredTransactions.filter(t => t.type === 'income');
  } else if (reportType === 'expenses') {
    filteredTransactions = filteredTransactions.filter(t => t.type === 'expense');
  }
  
  return filteredTransactions;
};

export const downloadCSV = (data: Transaction[]): void => {
  // Create CSV content
  const headers = ['Data', 'Tipo', 'Categoria', 'Descrição', 'Valor'];
  const csvContent = [
    headers.join(','),
    ...data.map(item => [
      new Date(item.date).toLocaleDateString(),
      item.type,
      item.category,
      `"${item.description.replace(/"/g, '""')}"`, // Escape quotes
      item.amount
    ].join(','))
  ].join('\n');
  
  // Create and trigger download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `poupeja-relatorio-${new Date().toISOString().slice(0, 10)}.csv`);
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Show success notification
  toast({
    title: "Relatório Baixado",
    description: "O relatório CSV foi baixado com sucesso.",
  });
};

export const downloadPDF = (data: Transaction[], companyName?: string): void => {
  try {
    // Create new PDF document
    const doc = new jsPDF();
    
    // Set document title
    doc.setFontSize(20);
    const title = companyName ? `Relatório Financeiro - ${companyName}` : 'Relatório Financeiro - Poupeja';
    doc.text(title, 20, 20);
    
    // Add generation date
    doc.setFontSize(12);
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 20, 35);
    
    // Calculate totals
    const totalIncome = data.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = data.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const balance = totalIncome - totalExpenses;
    
    // Add summary
    doc.setFontSize(14);
    doc.text('Resumo:', 20, 50);
    doc.setFontSize(12);
    doc.text(`Total de Receitas: R$ ${totalIncome.toFixed(2)}`, 20, 60);
    doc.text(`Total de Despesas: R$ ${totalExpenses.toFixed(2)}`, 20, 70);
    doc.text(`Saldo: R$ ${balance.toFixed(2)}`, 20, 80);
    
    // Prepare table data
    const tableData = data.map(transaction => [
      new Date(transaction.date).toLocaleDateString('pt-BR'),
      transaction.type === 'income' ? 'Receita' : 'Despesa',
      transaction.category,
      transaction.description,
      `R$ ${transaction.amount.toFixed(2)}`
    ]);
    
    // Create table
    autoTable(doc, {
      head: [['Data', 'Tipo', 'Categoria', 'Descrição', 'Valor']],
      body: tableData,
      startY: 95,
      styles: {
        fontSize: 10,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [66, 139, 202],
        textColor: 255,
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
      columnStyles: {
        0: { cellWidth: 25 }, // Data
        1: { cellWidth: 25 }, // Tipo
        2: { cellWidth: 35 }, // Categoria
        3: { cellWidth: 60 }, // Descrição
        4: { cellWidth: 30, halign: 'right' }, // Valor
      },
    });
    
    // Save the PDF
    const fileName = companyName 
      ? `${companyName.toLowerCase().replace(/\s+/g, '-')}-relatorio-${new Date().toISOString().slice(0, 10)}.pdf`
      : `poupeja-relatorio-${new Date().toISOString().slice(0, 10)}.pdf`;
    doc.save(fileName);
    
    // Show success notification
    toast({
      title: "Relatório PDF Baixado",
      description: "O relatório em PDF foi gerado e baixado com sucesso.",
    });
  } catch (error) {
    console.error('Erro ao gerar PDF:', error);
    toast({
      title: "Erro",
      description: "Ocorreu um erro ao gerar o relatório PDF.",
      variant: "destructive",
    });
  }
};
