import { format, subDays, addDays } from 'date-fns';

const today = new Date();
const fmt = (d) => format(d, 'yyyy-MM-dd');

export const TREATMENTS = [
    { id: 't1', name: 'Consultation', price: 300 },
    { id: 't2', name: 'X-Ray', price: 150 },
    { id: 't3', name: 'Cleaning / Scaling', price: 800 },
    { id: 't4', name: 'Filling (Composite)', price: 1200 },
    { id: 't5', name: 'Root Canal Treatment', price: 4500 },
    { id: 't6', name: 'Crown (Ceramic)', price: 8000 },
    { id: 't7', name: 'Tooth Extraction', price: 900 },
    { id: 't8', name: 'Implant', price: 25000 },
    { id: 't9', name: 'Teeth Whitening', price: 3500 },
    { id: 't10', name: 'Braces (per arch)', price: 35000 },
    { id: 't11', name: 'Intraoral Scan', price: 500 },
    { id: 't12', name: 'Tooth Jewellery', price: 600 },
];

export const DOCTORS = [
    { id: 'd1', name: 'Dr. Priya Sharma', speciality: 'Orthodontist', color: '#3b82f6' },
    { id: 'd2', name: 'Dr. Rajan Mehta', speciality: 'Endodontist', color: '#8b5cf6' },
    { id: 'd3', name: 'Dr. Sneha Verma', speciality: 'Implantologist', color: '#ec4899' },
    { id: 'd4', name: 'Dr. Arun Kumar', speciality: 'General Dentist', color: '#22c55e' },
];

export const CONDITIONS = [
    'Healthy', 'Cavity', 'Root Canal', 'Crown', 'Missing',
    'Implant', 'Filling', 'Cracked', 'Abscess', 'Sensitivity',
    'Under Observation', 'Bridge',
];

export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const mkPatient = (id, name, phone, nfcId, gender, dob, blood, medical, addr) => ({
    id,
    name,
    phone,
    altPhone: '',
    dob,
    gender,
    address: addr,
    email: `${name.toLowerCase().replace(' ', '.')}@email.com`,
    bloodGroup: blood,
    medicalHistory: medical,
    allergies: '',
    conditions: '',
    emergencyContact: '',
    notes: '',
    nfcId,
    registrationDate: fmt(subDays(today, Math.floor(Math.random() * 90))),
    firstDoctor: 'd1',
    status: 'active',
    toothRecords: generateToothRecords(id),
    scans: [],
});

function generateToothRecords(patientId) {
    const records = {};
    // Sample conditions for demo
    if (patientId === 'p1') {
        records['16'] = { status: 'issue', condition: 'Cavity', notes: 'Deep cavity needing RCT', imageUrls: [] };
        records['26'] = { status: 'treatment', condition: 'Root Canal', notes: 'RCT in progress', imageUrls: [] };
        records['36'] = { status: 'completed', condition: 'Crown', notes: 'Ceramic crown placed', imageUrls: [] };
        records['11'] = { status: 'issue', condition: 'Sensitivity', notes: 'Dentin sensitivity', imageUrls: [] };
    } else if (patientId === 'p2') {
        records['14'] = { status: 'treatment', condition: 'Filling', notes: 'Composite filling', imageUrls: [] };
        records['24'] = { status: 'completed', condition: 'Filling', notes: 'Old amalgam replaced', imageUrls: [] };
        records['18'] = { status: 'missing', condition: 'Missing', notes: 'Extraction done 2yr ago', imageUrls: [] };
    } else if (patientId === 'p3') {
        records['21'] = { status: 'completed', condition: 'Crown', notes: 'Zirconia crown', imageUrls: [] };
        records['31'] = { status: 'issue', condition: 'Abscess', notes: 'Periapical abscess', imageUrls: [] };
    }
    return records;
}

export const MOCK_PATIENTS = [
    mkPatient('p1', 'Arjun Kapoor', '9876543210', 'NFC001', 'Male', '1990-05-14', 'O+', 'Hypertension', '12 MG Road, Bengaluru'),
    mkPatient('p2', 'Priya Nair', '8765432109', 'NFC002', 'Female', '1985-11-22', 'A+', 'Diabetes Type 2', '45 Anna Nagar, Chennai'),
    mkPatient('p3', 'Rohit Sharma', '7654321098', 'NFC003', 'Male', '1995-03-08', 'B+', 'None', '78 Bandra West, Mumbai'),
    mkPatient('p4', 'Kavitha Reddy', '6543210987', 'NFC004', 'Female', '1978-07-30', 'AB+', 'Thyroid', '22 Film Nagar, Hyderabad'),
    mkPatient('p5', 'Vikram Singh', '9988776655', 'NFC005', 'Male', '2001-12-15', 'O-', 'None', '3 Sector 15, Noida'),
];

export const MOCK_APPOINTMENTS = [
    { id: 'a1', patientId: 'p1', doctorId: 'd2', date: fmt(today), time: '09:00', treatmentType: 'Root Canal Treatment', status: 'in-treatment', notes: 'Continuing RCT on tooth 26' },
    { id: 'a2', patientId: 'p2', doctorId: 'd1', date: fmt(today), time: '10:30', treatmentType: 'Consultation', status: 'waiting', notes: '' },
    { id: 'a3', patientId: 'p3', doctorId: 'd4', date: fmt(today), time: '11:00', treatmentType: 'Cleaning / Scaling', status: 'scheduled', notes: '' },
    { id: 'a4', patientId: 'p4', doctorId: 'd3', date: fmt(today), time: '14:00', treatmentType: 'Implant consultation', status: 'scheduled', notes: 'Lower molar implant' },
    { id: 'a5', patientId: 'p5', doctorId: 'd4', date: fmt(today), time: '15:30', treatmentType: 'X-Ray', status: 'scheduled', notes: '' },
    { id: 'a6', patientId: 'p1', doctorId: 'd2', date: fmt(addDays(today, 3)), time: '09:30', treatmentType: 'Crown Placement', status: 'scheduled', notes: '' },
    { id: 'a7', patientId: 'p2', doctorId: 'd1', date: fmt(subDays(today, 1)), time: '11:00', treatmentType: 'Filling', status: 'completed', notes: '' },
];

export const MOCK_BILLS = [
    {
        id: 'b1', patientId: 'p1', date: fmt(subDays(today, 7)),
        items: [
            { treatment: 'Root Canal Treatment', tooth: '26', price: 4500, qty: 1 },
            { treatment: 'X-Ray', tooth: '26', price: 150, qty: 2 },
        ],
        discount: 200, gst: true, paymentMode: 'UPI', status: 'paid',
        total: 4752, paid: 4752,
        notes: 'First sitting of RCT',
    },
    {
        id: 'b2', patientId: 'p2', date: fmt(subDays(today, 3)),
        items: [
            { treatment: 'Cleaning / Scaling', tooth: '', price: 800, qty: 1 },
            { treatment: 'Consultation', tooth: '', price: 300, qty: 1 },
        ],
        discount: 0, gst: false, paymentMode: 'Cash', status: 'paid',
        total: 1100, paid: 1100,
        notes: '',
    },
    {
        id: 'b3', patientId: 'p3', date: fmt(today),
        items: [
            { treatment: 'Crown (Ceramic)', tooth: '21', price: 8000, qty: 1 },
            { treatment: 'Consultation', tooth: '', price: 300, qty: 1 },
        ],
        discount: 500, gst: true, paymentMode: 'Card', status: 'pending',
        total: 9234, paid: 5000,
        notes: 'Balance ₹4,234 due on next visit',
    },
    {
        id: 'b4', patientId: 'p4', date: fmt(subDays(today, 15)),
        items: [
            { treatment: 'Implant', tooth: '36', price: 25000, qty: 1 },
        ],
        discount: 2000, gst: true, paymentMode: 'Split', status: 'partial',
        total: 27140, paid: 15000,
        notes: 'Balance pending',
    },
];

export const REVENUE_DATA = [
    { day: 'Mon', revenue: 12400 },
    { day: 'Tue', revenue: 18900 },
    { day: 'Wed', revenue: 9200 },
    { day: 'Thu', revenue: 22100 },
    { day: 'Fri', revenue: 16800 },
    { day: 'Sat', revenue: 31500 },
    { day: 'Sun', revenue: 4200 },
];

export const MONTHLY_DATA = [
    { month: 'Aug', patients: 42 }, { month: 'Sep', patients: 58 },
    { month: 'Oct', patients: 51 }, { month: 'Nov', patients: 67 },
    { month: 'Dec', patients: 48 }, { month: 'Jan', patients: 72 },
];

export const TREATMENT_DIST = [
    { name: 'Root Canal', value: 28 }, { name: 'Filling', value: 35 },
    { name: 'Cleaning', value: 42 }, { name: 'Extraction', value: 18 },
    { name: 'Crown', value: 12 }, { name: 'Implant', value: 8 },
    { name: 'Consultation', value: 55 },
];
