import { months } from "../constants/constants";

// Helper function to format a Date object as "dd-Month-yyyy"
export const formatDate = (date: Date): string => {
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${months[date.getMonth()-1]}-${year}`;
};

// Helper function to parse a "dd-Month-yyyy" string into a Date object
export const parseDate = (dateString: string): Date => {
    const [day, month, year] = dateString.split('-');
    return new Date(Number(year),months.indexOf(month), Number(day)); // Months are 0-based
};
