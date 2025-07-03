
export interface ISupplier {
    name: string;
    email?: string;
    phone: string;
    gstid: string;
    createdBy?: string; // Assuming this is the user ID of the creator
    website?: string;
    address?: string;
}