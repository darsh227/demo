const ERRORMESSAGES = {
    USER_NOT_FOUND: 'User not found:',
    DB_QUERY_ERROR: 'DATA ENTRY ERROR:',
    USER_NOT_FOUND: 'User not found:',
    INVALID_PASSWORD: 'Invalid password:',
    SERVER_ERROR: 'Internal server error:',
    DATA_ERROR: 'DATA REQUIRED:',
    PROCESSING:"ERROR PROCESSING REQUEST:",
    INVALID_CREDENTIAL:"INCORRECT USERNAME PASSWORD:",
    NO_CHANGE:"NO DATA AFFECTED:",
    PRODUCT_NOT_FOUND:"NO such product found:",
    INVALID_DISCOUNT_TYPE:"invalid discount type:",
    FETCHING:"ERROR FETCHING DATA:",
    DATA_ALREADY_EXISTS:" Employee salary slip for this month already exists."
};
const MESSAGES = {
    DATA_ENTERED: 'DATA ENTERD SUCCESSFULLY',
    DATA_UPDATED: 'DATA UPDATED SUCCESSFULLY',
    DATA_DELETED: 'DATA DELETED SUCCESSFULLY',
};

const TABLENAMES = {
    ADMIN: 'admin',
    EMPLOYEE: 'employee',
    SALARY: 'salary_slip'
};

module.exports = {
    ERRORMESSAGES,
    MESSAGES,
    TABLENAMES,
};
