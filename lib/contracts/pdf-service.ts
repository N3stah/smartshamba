import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import { prisma } from '@/lib/prisma';

export async function generateContractPdf(contractId: string): Promise<Buffer> {
  const contract = await prisma.contract.findUnique({
    where: { id: contractId },
    include: { transaction: { include: { farmer: true, buyer: true } } }
  });

  if (!contract) throw new Error('Contract not found');

  const terms = contract.terms as any;
  const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/contracts/verify/${contract.verificationId}`;
  
  // Generate QR Code Data URL
  const qrDataUrl = await QRCode.toDataURL(verificationUrl, { width: 150, margin: 1 });

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const buffers: Buffer[] = [];

    doc.on('data', (buffer) => buffers.push(buffer));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    // Header
    doc.fontSize(20).fillColor('#00703C').text('SmartShamba', { align: 'center' });
    doc.fontSize(10).fillColor('#666').text('Digital Agricultural Contract', { align: 'center' });
    doc.moveDown(1.5);

    // Contract Details
    doc.fontSize(14).fillColor('#000').text(`Contract Reference: ${contract.id.substring(0, 8)}`);
    doc.fontSize(10).text(`Transaction Ref: ${contract.transaction.reference}`);
    doc.text(`Status: ${contract.status}`);
    doc.text(`Date: ${new Date(contract.createdAt).toLocaleDateString('en-KE')}`);
    doc.moveDown(1);

    // Parties
    doc.fontSize(12).fillColor('#00703C').text('Parties Involved');
    doc.fontSize(10).fillColor('#000').text(`Seller (Farmer): ${terms.farmerName || 'N/A'}`);
    doc.text(`Buyer: ${terms.buyerName || 'N/A'}`);
    doc.moveDown(1);

    // Terms
    doc.fontSize(12).fillColor('#00703C').text('Terms of Agreement');
    doc.fontSize(10).fillColor('#000').text(`Crop: ${terms.crop || 'Maize'}`);
    doc.text(`Quantity: ${terms.quantityBags} bags`);
    doc.text(`Unit Price: KSh ${terms.pricePerBag?.toLocaleString()}`);
    doc.text(`Total Value: KSh ${terms.totalValue?.toLocaleString()}`);
    doc.text(`Payment Terms: ${contract.paymentTerms}`);
    if (contract.transportTerms) doc.text(`Transport Terms: ${contract.transportTerms}`);
    doc.moveDown(2);

    // Signatures
    doc.fontSize(12).fillColor('#00703C').text('Digital Signatures');
    doc.moveDown(0.5);
    
    doc.fontSize(10).fillColor('#000');
    doc.text(`Farmer Signature:`, { continued: true }).fillColor(contract.farmerSigned ? '#00703C' : '#999').text(` ${contract.farmerSignature || 'Not Signed'}`);
    if (contract.farmerSignedAt) doc.fillColor('#666').text(`Signed on: ${new Date(contract.farmerSignedAt).toLocaleString('en-KE')}`);

    doc.moveDown(0.5);
    doc.fillColor('#000').text(`Buyer Signature:`, { continued: true }).fillColor(contract.buyerSigned ? '#00703C' : '#999').text(` ${contract.buyerSignature || 'Not Signed'}`);
    if (contract.buyerSignedAt) doc.fillColor('#666').text(`Signed on: ${new Date(contract.buyerSignedAt).toLocaleString('en-KE')}`);

    // QR Verification
    doc.moveDown(3);
    doc.image(qrDataUrl, { fit: [100, 100], align: 'center' });
    doc.fillColor('#666').fontSize(8).text('Scan to verify contract authenticity', { align: 'center' });
    doc.text(verificationUrl, { align: 'center', link: verificationUrl });

    doc.end();
  });
}
