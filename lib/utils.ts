import { months } from "../constants/constants";

// Helper function to format a Date object as "dd-Month-yyyy"
export const formatDate = (date: Date): string => {
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${months[date.getMonth()]}-${year}`;
};

// Helper function to parse a "dd-Month-yyyy" string into a Date object
export const parseDate = (dateString: string): Date => {
    const parts = dateString.trim().split('-');
    if (parts.length < 2 || parts.length > 3) throw new Error(`Invalid date: ${dateString}`);
    const [dayStr, monthStr, yearStr] = parts;

    const day = Number(dayStr);
    const monthIndex = months.findIndex(m => m.toLowerCase() === monthStr.toLowerCase());
    if (Number.isNaN(day) || monthIndex === -1) throw new Error(`Invalid date: ${dateString}`);

    const year = yearStr ? Number(yearStr) : new Date().getFullYear();
    if (Number.isNaN(year)) throw new Error(`Invalid year: ${yearStr}`);

    return new Date(year, monthIndex, day); // month is 0-based
};
