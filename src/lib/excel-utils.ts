import * as XLSX from 'xlsx';

export interface TemplateSheet {
  name: string;
  headers: string[];
  data?: any[];
  description?: string;
}

// Template structure for import
export const importTemplateSheets: TemplateSheet[] = [
  {
    name: 'Products',
    description: 'Anagrafica prodotti principali',
    headers: [
      'product_id',
      'product_type',
      'name', 
      'internal_code',
      'uom',
      'base_cost',
      'gross_margin_pct',
      'base_list_price',
      'drawing_link_url',
      'notes',
      'created_at',
      'updated_at'
    ],
    data: [
      {
        product_id: 'G-2847',
        product_type: 'impeller',
        name: 'Girante Standard 85mm',
        internal_code: 'GS-085-NBR',
        uom: 'pcs',
        base_cost: 45.80,
        gross_margin_pct: 35,
        base_list_price: 70.46,
        drawing_link_url: 'https://drawings.company.com/G-2847.pdf',
        notes: 'Girante standard per pompe centrifughe marine',
        created_at: '2024-01-15T10:30:00Z',
        updated_at: '2024-01-20T14:22:00Z'
      }
    ]
  },
  {
    name: 'ImpellerDims',
    description: 'Dimensioni specifiche giranti',
    headers: [
      'product_id',
      'outer_diameter_mm',
      'inner_diameter_mm',
      'thickness_mm',
      'blade_count',
      'shaft_diameter_mm',
      'shaft_profile',
      'rubber_volume_cm3',
      'drawing_notes'
    ],
    data: [
      {
        product_id: 'G-2847',
        outer_diameter_mm: 85,
        inner_diameter_mm: 12,
        thickness_mm: 15,
        blade_count: 6,
        shaft_diameter_mm: 12,
        shaft_profile: 'round',
        rubber_volume_cm3: 45.5,
        drawing_notes: 'Girante standard marina'
      }
    ]
  },
  {
    name: 'RubberMix',
    description: 'Mescole gomma disponibili',
    headers: [
      'mix_code',
      'mix_name',
      'base_polymer',
      'shore_hardness',
      'density_g_cm3',
      'material_price_per_kg',
      'color',
      'marine_approved',
      'temperature_range',
      'notes'
    ],
    data: [
      {
        mix_code: 'NBR-85',
        mix_name: 'NBR Standard Marine',
        base_polymer: 'NBR',
        shore_hardness: 85,
        density_g_cm3: 1.45,
        material_price_per_kg: 12.50,
        color: 'Nero',
        marine_approved: 'Yes',
        temperature_range: '-20°C / +80°C',
        notes: 'Mescola standard per applicazioni marine'
      },
      {
        mix_code: 'EPDM-70',
        mix_name: 'EPDM Marine White',
        base_polymer: 'EPDM',
        shore_hardness: 70,
        density_g_cm3: 1.25,
        material_price_per_kg: 15.80,
        color: 'Bianco',
        marine_approved: 'Yes',
        temperature_range: '-30°C / +120°C',
        notes: 'Resistente UV e ozono'
      }
    ]
  },
  {
    name: 'Bushing',
    description: 'Bussole disponibili',
    headers: [
      'bushing_code',
      'bushing_name',
      'material',
      'outer_diameter_mm',
      'inner_diameter_mm',
      'length_mm',
      'shaft_profile_type',
      'cost_each',
      'supplier',
      'lead_time_days',
      'notes'
    ],
    data: [
      {
        bushing_code: 'BO-012',
        bushing_name: 'Bussola Ottone 12mm',
        material: 'Ottone',
        outer_diameter_mm: 18,
        inner_diameter_mm: 12,
        length_mm: 25,
        shaft_profile_type: 'round',
        cost_each: 8.50,
        supplier: 'Fornitore A',
        lead_time_days: 15,
        notes: 'Bussola standard ottone'
      },
      {
        bushing_code: 'BP-012',
        bushing_name: 'Bussola Plastica 12mm',
        material: 'Plastica',
        outer_diameter_mm: 18,
        inner_diameter_mm: 12,
        length_mm: 25,
        shaft_profile_type: 'round',
        cost_each: 3.20,
        supplier: 'Fornitore B',
        lead_time_days: 10,
        notes: 'Alternativa economica'
      }
    ]
  },
  {
    name: 'Customers',
    description: 'Anagrafica clienti',
    headers: [
      'customer_id',
      'company_name',
      'contact_person',
      'email',
      'phone',
      'address',
      'city',
      'country',
      'vat_number',
      'payment_terms',
      'discount_pct',
      'price_list',
      'created_at'
    ],
    data: [
      {
        customer_id: 'C-001',
        company_name: 'Marina del Porto SRL',
        contact_person: 'Mario Rossi',
        email: 'mario.rossi@marinadelporto.it',
        phone: '+39 0123 456789',
        address: 'Via del Mare 123',
        city: 'La Spezia',
        country: 'Italia',
        vat_number: 'IT12345678901',
        payment_terms: '30gg',
        discount_pct: 15,
        price_list: 'Standard',
        created_at: '2024-01-10T08:00:00Z'
      }
    ]
  },
  {
    name: 'PriceLists',
    description: 'Listini prezzi per clienti',
    headers: [
      'price_list_id',
      'customer_id',
      'product_id',
      'list_price',
      'discount_pct',
      'final_price',
      'currency',
      'valid_from',
      'valid_to',
      'notes'
    ],
    data: [
      {
        price_list_id: 'PL-001',
        customer_id: 'C-001',
        product_id: 'G-2847',
        list_price: 70.46,
        discount_pct: 15,
        final_price: 59.89,
        currency: 'EUR',
        valid_from: '2024-01-01',
        valid_to: '2024-12-31',
        notes: 'Prezzo speciale contratto annuale'
      }
    ]
  },
  {
    name: 'EquivalentImpeller',
    description: 'Equivalenze tra giranti',
    headers: [
      'source_product_id',
      'target_product_id',
      'match_type',
      'dimension_tolerance_mm',
      'material_note',
      'bushing_note',
      'shaft_profile_note',
      'general_note'
    ],
    data: [
      {
        source_product_id: 'G-2847',
        target_product_id: 'G-2901',
        match_type: 'dimensional',
        dimension_tolerance_mm: 1.0,
        material_note: 'Compatibile EPDM/NBR',
        bushing_note: 'Stesso profilo albero',
        shaft_profile_note: 'D-shaft 12mm',
        general_note: 'Sostituzione diretta per applicazioni marine standard'
      }
    ]
  },
  {
    name: 'EquivalentBushing',
    description: 'Equivalenze tra bussole',
    headers: [
      'source_bushing_code',
      'target_bushing_code',
      'match_type',
      'shaft_profile_compatible',
      'material_note',
      'general_note'
    ],
    data: [
      {
        source_bushing_code: 'BO-012',
        target_bushing_code: 'BP-012',
        match_type: 'form-fit',
        shaft_profile_compatible: 'yes',
        material_note: 'Ottone vs Plastica - prestazioni simili',
        general_note: 'Alternativa economica per applicazioni meno critiche'
      }
    ]
  },
  {
    name: 'RFQ',
    description: 'Richieste di quotazione',
    headers: [
      'rfq_id',
      'customer_id',
      'rfq_date',
      'status',
      'notes',
      'created_at',
      'updated_at'
    ],
    data: [
      {
        rfq_id: 'RFQ-2024-001',
        customer_id: 'C-001',
        rfq_date: '2024-01-20',
        status: 'open',
        notes: 'Richiesta urgente per sostituzione giranti pompe principali',
        created_at: '2024-01-20T09:30:00Z',
        updated_at: '2024-01-20T09:30:00Z'
      }
    ]
  },
  {
    name: 'RFQLines',
    description: 'Righe delle RFQ',
    headers: [
      'rfq_line_id',
      'rfq_id',
      'product_id',
      'quantity',
      'unit_price',
      'total_price',
      'delivery_weeks',
      'notes'
    ],
    data: [
      {
        rfq_line_id: 'RFQ-LINE-001',
        rfq_id: 'RFQ-2024-001',
        product_id: 'G-2847',
        quantity: 2,
        unit_price: 59.89,
        total_price: 119.78,
        delivery_weeks: 3,
        notes: 'Urgente per manutenzione programmata'
      }
    ]
  }
];

export const generateImportTemplate = (): ArrayBuffer => {
  const wb = XLSX.utils.book_new();
  
  // Add info sheet
  const infoSheet = XLSX.utils.aoa_to_sheet([
    ['TEMPLATE IMPORT NAUTICAL BU v3.0'],
    [''],
    ['ISTRUZIONI:'],
    ['1. Compilare ogni foglio con i dati necessari'],
    ['2. Rispettare i formati delle colonne (date, numeri, testo)'],
    ['3. Non modificare i nomi dei fogli'],
    ['4. Verificare che tutti i codici prodotto siano univoci'],
    ['5. Utilizzare solo i valori consentiti per i campi enum'],
    [''],
    ['FORMATI CONSENTITI:'],
    ['• product_type: impeller, bushing, kit, generic'],
    ['• uom: pcs, set, kg, m, other'],
    ['• match_type: full, dimensional, form-fit, partial'],
    ['• rfq_status: open, quoted, won, lost, on_hold'],
    ['• shaft_profile_compatible: yes, no, unknown'],
    [''],
    ['NOTA: Questo template include dati di esempio che possono essere sostituiti'],
    ['con i vostri dati reali. I dati di esempio mostrano il formato corretto.']
  ]);
  XLSX.utils.book_append_sheet(wb, infoSheet, 'INFO');
  
  // Add each data sheet
  importTemplateSheets.forEach(sheet => {
    let sheetData: any[][] = [];
    
    // Add description row
    if (sheet.description) {
      sheetData.push([sheet.description]);
      sheetData.push([]);
    }
    
    // Add headers
    sheetData.push(sheet.headers);
    
    // Add sample data if available
    if (sheet.data && sheet.data.length > 0) {
      sheet.data.forEach(row => {
        const rowData = sheet.headers.map(header => row[header] || '');
        sheetData.push(rowData);
      });
    } else {
      // Add empty row for user input
      sheetData.push(sheet.headers.map(() => ''));
    }
    
    const ws = XLSX.utils.aoa_to_sheet(sheetData);
    
    // Set column widths
    const colWidths = sheet.headers.map(header => ({ wch: Math.max(header.length + 2, 15) }));
    ws['!cols'] = colWidths;
    
    XLSX.utils.book_append_sheet(wb, ws, sheet.name);
  });
  
  return XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
};

export const downloadTemplate = () => {
  try {
    const buffer = generateImportTemplate();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `Nautical_BU_Import_Template_v3_${new Date().toISOString().slice(0, 10)}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
    return true;
  } catch (error) {
    console.error('Errore durante la creazione del template:', error);
    return false;
  }
};

// Price List Template
export const priceListTemplate: TemplateSheet = {
  name: 'PriceListImport',
  description: 'Template per importazione listini prezzi',
  headers: [
    'product_code',
    'customer_name', 
    'list_name',
    'list_version',
    'list_identifier',
    'unit_price'
  ],
  data: [
    {
      product_code: 'SP-3142',
      customer_name: 'Marina SpA',
      list_name: 'Listino 2024',
      list_version: 'v1.0', 
      list_identifier: '2024-001',
      unit_price: 85.50
    },
    {
      product_code: 'SP-2847',
      customer_name: 'Marina SpA',
      list_name: 'Listino 2024', 
      list_version: 'v1.0',
      list_identifier: '2024-001',
      unit_price: 72.30
    }
  ]
};

export const downloadPriceListTemplate = () => {
  try {
    const wb = XLSX.utils.book_new();
    
    // Add info sheet
    const infoSheet = XLSX.utils.aoa_to_sheet([
      ['TEMPLATE IMPORTAZIONE LISTINI PREZZI'],
      [''],
      ['ISTRUZIONI:'],
      ['1. Compilare tutte le colonne obbligatorie'],
      ['2. I codici prodotto devono esistere nel database'],
      ['3. I prezzi verranno confrontati con i costi base per calcolare i margini'],
      ['4. Se il cliente non esiste verrà creato automaticamente'],
      [''],
      ['COLONNE:'],
      ['• product_code: Codice prodotto (obbligatorio)'],
      ['• customer_name: Nome cliente (obbligatorio)'],
      ['• list_name: Nome del listino (obbligatorio)'],
      ['• list_version: Versione listino (es. v1.0)'],
      ['• list_identifier: Identificativo univoco (es. 2024-001)'],
      ['• unit_price: Prezzo unitario in EUR (obbligatorio)'],
      [''],
      ['NOTA: Il margine verrà calcolato automaticamente confrontando'],
      ['il prezzo unitario con il costo base del prodotto nel database.']
    ]);
    XLSX.utils.book_append_sheet(wb, infoSheet, 'ISTRUZIONI');
    
    // Add template sheet
    const templateData = priceListTemplate.data || [];
    const ws = XLSX.utils.json_to_sheet(templateData);
    
    // Set column widths
    ws['!cols'] = [
      { wch: 15 }, // product_code
      { wch: 25 }, // customer_name
      { wch: 20 }, // list_name
      { wch: 12 }, // list_version
      { wch: 15 }, // list_identifier  
      { wch: 12 }  // unit_price
    ];
    
    XLSX.utils.book_append_sheet(wb, ws, priceListTemplate.name);
    
    const buffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `Template_Listini_Prezzi_${new Date().toISOString().slice(0, 10)}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
    return true;
  } catch (error) {
    console.error('Errore durante la creazione del template listini:', error);
    return false;
  }
};

export const downloadExportData = async (exportType: 'products' | 'customers' | 'rfq' | 'equivalences' | 'complete', format: 'xlsx' | 'csv' = 'xlsx') => {
  try {
    const wb = XLSX.utils.book_new();
    
    // This function will be used for the 'complete' export type
    // Individual types are now handled directly in the ImportExport component
    if (exportType === 'complete') {
      importTemplateSheets.forEach(sheet => {
        let sheetData: any[][] = [];
        
        // Add headers
        sheetData.push(sheet.headers);
        
        // Add sample data
        if (sheet.data && sheet.data.length > 0) {
          sheet.data.forEach(row => {
            const rowData = sheet.headers.map(header => row[header] || '');
            sheetData.push(rowData);
          });
        }
        
        const ws = XLSX.utils.aoa_to_sheet(sheetData);
        const colWidths = sheet.headers.map(header => ({ wch: Math.max(header.length + 2, 15) }));
        ws['!cols'] = colWidths;
        
        XLSX.utils.book_append_sheet(wb, ws, sheet.name);
      });
      
      const timestamp = new Date().toISOString().slice(0, 10);
      const filename = `Nautical_BU_Complete_Export_${timestamp}`;
      
      if (format === 'xlsx') {
        XLSX.writeFile(wb, `${filename}.xlsx`);
      } else {
        // For CSV complete export, create a ZIP with multiple CSV files
        const firstSheet = importTemplateSheets[0];
        let csvData: any[][] = [];
        
        csvData.push(firstSheet.headers);
        if (firstSheet.data && firstSheet.data.length > 0) {
          firstSheet.data.forEach(row => {
            const rowData = firstSheet.headers.map(header => row[header] || '');
            csvData.push(rowData);
          });
        }
        
        const ws = XLSX.utils.aoa_to_sheet(csvData);
        const csv = XLSX.utils.sheet_to_csv(ws);
        
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `${filename}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(url);
      }
    }
    
    return true;
  } catch (error) {
    console.error('Errore durante l\'export:', error);
    return false;
  }
};