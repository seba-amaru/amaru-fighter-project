export const exportToFormat = (format, data, headers, filename) => {
    if (format === 'csv') {
        const csvContent = [
            headers.join(','),
            ...data.map(row => Object.values(row).map(val => `"${val}"`).join(','))
        ].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${filename}.csv`;
        link.click();
    } else if (format === 'xls') {
        const table = document.createElement('table');
        const thead = document.createElement('thead');
        const trHead = document.createElement('tr');
        headers.forEach(h => { const th = document.createElement('th'); th.innerText = h; trHead.appendChild(th); });
        thead.appendChild(trHead); table.appendChild(thead);
        const tbody = document.createElement('tbody');
        data.forEach(row => {
            const tr = document.createElement('tr');
            Object.values(row).forEach(val => { const td = document.createElement('td'); td.innerText = val; tr.appendChild(td); });
            tbody.appendChild(tr);
        });
        table.appendChild(tbody);
        const html = `<html><head><meta charset="UTF-8"></head><body>${table.outerHTML}</body></html>`;
        const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${filename}.xls`;
        link.click();
    } else if (format === 'pdf') {
        if (typeof window.jspdf !== 'undefined') {
            const doc = new window.jspdf.jsPDF();
            doc.autoTable({
                head: [headers],
                body: data.map(r => Object.values(r)),
                theme: 'grid',
                styles: { fontSize: 8 },
                headStyles: { fillColor: [139, 92, 246] }
            });
            doc.save(`${filename}.pdf`);
        } else {
            window.showToast("Librería PDF no cargada", "#eab308");
        }
    }
};

export const exportUserData = (users, format) => {
    const headers = ['Nombre', 'Email', 'Teléfono', 'Nivel', 'Plan', 'Estado', 'Vencimiento'];
    const data = users.map(u => ({
        name: u.full_name || 'Sin Nombre',
        email: u.email || '',
        phone: u.phone || '',
        level: u.level || 0,
        plan: u.membership_plans?.name || 'Sin Plan',
        status: u._computedStatus || 'Desconocido',
        expiry: u._expiryDate ? u._expiryDate.toLocaleDateString() : 'N/A'
    }));
    exportToFormat(format, data, headers, `Socios_Amaru_${new Date().toISOString().split('T')[0]}`);
};
