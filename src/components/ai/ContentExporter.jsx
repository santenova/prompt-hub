import React from 'react';
import { Button } from "@/components/ui/button";
import { FileDown, FileText, Download } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import jsPDF from 'jspdf';

export default function ContentExporter({ variations, topic, contentType }) {
  const { toast } = useToast();

  const exportToPDF = () => {
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;
      const contentWidth = pageWidth - 2 * margin;
      let yPosition = margin;

      // Title
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(16);
      doc.text(`${contentType.charAt(0).toUpperCase() + contentType.slice(1)} - ${topic}`, margin, yPosition);
      yPosition += 15;

      // Metadata
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Generated: ${new Date().toLocaleDateString()} | ${variations.length} variation${variations.length > 1 ? 's' : ''}`, margin, yPosition);
      doc.setTextColor(0);
      yPosition += 12;

      // Separator
      doc.setDrawColor(200);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 8;

      // Content
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(11);

      variations.forEach((variation, idx) => {
        // Check if we need a new page
        if (yPosition > pageHeight - 30) {
          doc.addPage();
          yPosition = margin;
        }

        // Variation header
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(0, 102, 204);
        doc.text(`Variation ${idx + 1}: ${variation.title || 'Untitled'}`, margin, yPosition);
        doc.setTextColor(0);
        yPosition += 8;

        // Content
        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(10);
        const contentLines = doc.splitTextToSize(variation.content || '', contentWidth);
        doc.text(contentLines, margin, yPosition);
        yPosition += contentLines.length * 4 + 5;

        // Metadata for variation
        doc.setFont('Helvetica', 'italic');
        doc.setFontSize(9);
        doc.setTextColor(100);
        if (variation.word_count) {
          doc.text(`Words: ${variation.word_count}`, margin, yPosition);
          yPosition += 4;
        }
        if (variation.approach) {
          doc.text(`Approach: ${variation.approach.substring(0, 60)}...`, margin, yPosition);
          yPosition += 4;
        }
        yPosition += 6;

        // Separator
        doc.setDrawColor(220);
        doc.line(margin, yPosition, pageWidth - margin, yPosition);
        yPosition += 8;
      });

      doc.save(`${topic.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_content.pdf`);
      toast({
        title: "PDF Exported",
        description: `${variations.length} variation${variations.length > 1 ? 's' : ''} saved to PDF`
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const exportToCSV = () => {
    try {
      const headers = ['Variation', 'Title', 'Content', 'Word Count', 'Approach', 'Best For'];
      const rows = variations.map((v, idx) => [
        `Variation ${idx + 1}`,
        v.title || '',
        `"${(v.content || '').replace(/"/g, '""')}"`,
        v.word_count || 0,
        v.approach || '',
        v.best_for || ''
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${topic.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_content.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "CSV Exported",
        description: `${variations.length} variation${variations.length > 1 ? 's' : ''} saved to CSV`
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const exportToText = () => {
    try {
      const textContent = [
        `${contentType.toUpperCase()} - ${topic}`,
        `Generated: ${new Date().toLocaleDateString()}`,
        `Total Variations: ${variations.length}`,
        '\n' + '='.repeat(80) + '\n'
      ];

      variations.forEach((variation, idx) => {
        textContent.push(
          `VARIATION ${idx + 1}: ${variation.title || 'Untitled'}`,
          '-'.repeat(60),
          variation.content || '',
          ''
        );

        if (variation.word_count) {
          textContent.push(`Word Count: ${variation.word_count}`);
        }
        if (variation.approach) {
          textContent.push(`Approach: ${variation.approach}`);
        }
        if (variation.best_for) {
          textContent.push(`Best For: ${variation.best_for}`);
        }

        textContent.push('\n' + '='.repeat(80) + '\n');
      });

      const blob = new Blob([textContent.join('\n')], { type: 'text/plain;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${topic.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_content.txt`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Text Exported",
        description: `${variations.length} variation${variations.length > 1 ? 's' : ''} saved as TXT`
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        onClick={exportToPDF}
        variant="outline"
        size="sm"
        className="bg-red-50 hover:bg-red-100 border-red-300 text-red-700">
        <FileText className="w-4 h-4 mr-2" />
        PDF
      </Button>
      <Button
        onClick={exportToCSV}
        variant="outline"
        size="sm"
        className="bg-green-50 hover:bg-green-100 border-green-300 text-green-700">
        <Download className="w-4 h-4 mr-2" />
        CSV
      </Button>
      <Button
        onClick={exportToText}
        variant="outline"
        size="sm"
        className="bg-blue-50 hover:bg-blue-100 border-blue-300 text-blue-700">
        <FileDown className="w-4 h-4 mr-2" />
        TXT
      </Button>
    </div>
  );
}