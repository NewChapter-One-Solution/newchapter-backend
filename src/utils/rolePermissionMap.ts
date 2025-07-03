// src/config/rolePermissionMap.ts
export const rolePermissionMap: Record<string, string[]> = {
    admin: ['*'], // Full access

    manager: [
        // Inventory
        'inventory.view', 'inventory.add', 'inventory.update', 'inventory.adjust_stock',

        // Products
        'product.view', 'product.create', 'product.update', 'product.manage_variants',

        // Orders
        'order.view', 'order.update_status', 'order.create', 'order.cancel',

        // Customers
        'customer.view', 'customer.edit',

        // Staff
        'staff.view',

        // Billing & Reports
        'billing.view', 'reports.view_sales', 'reports.view_stock',

        // Settings
        'settings.update'
    ],

    staff: [
        // Inventory
        'inventory.view', 'inventory.update', 'inventory.adjust_stock',

        // Products
        'product.view',

        // Orders
        'order.view', 'order.update_status',

        // Customers
        'customer.view',
    ]
};
