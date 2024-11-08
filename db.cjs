const fs = require('fs');
const {faker} = require('@faker-js/faker');
const usedNumbers = new Set();

function generateUniqueNumber() {
    let number;
    do {
        number = faker.number.int({
            min: 10000000000,
            max: 99999999999
        }).toString();
    } while (usedNumbers.has(number));
    usedNumbers.add(number); // Mark the number as used
    return number;
}

const users = Array.from({ length: 500 }, () => ({
    personalNumber: generateUniqueNumber(),
    name: faker.person.firstName(),
    surname: faker.person.lastName(),
    status: faker.helpers.arrayElement(['მოქმედი', 'უარყოფილი', 'გამოყენებული', 'ვადაგასული', 'გაუქმებული', 'დახურული']),
    phoneNumber: faker.phone.number()
}));

const companies = Array.from({ length: 500 }, () => ({
    clientName: faker.company.name(),
    taxNumber: generateUniqueNumber(),
    legPerson: faker.person.firstName() + " " + faker.person.firstName(),
    legPersonTax: generateUniqueNumber(),
    status: faker.helpers.arrayElement(['მოქმედი', 'უარყოფილი', 'გამოყენებული', 'ვადაგასული', 'გაუქმებული', 'დახურული']),
    phoneNumber: faker.phone.number()
}));

const sandro = {personalNumber: 38001046165, name: "სანდრო", surname: 'ღუღუნიშვილი', status: "მოქმედი", phoneNumber: 598414141}
users.unshift(sandro)
const data = { users, companies };

fs.writeFileSync('db.json', JSON.stringify(data, null, 2), 'utf-8');
console.log("Data has been written to db.json");