const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const xml2js = require('xml2js');


const app = express();
app.use(bodyParser.json());

const validateMessageRequest = (req, res, next) => {

    const {content, from, to} = req.body;
    if (typeof content === 'string' && typeof from === 'string' && typeof to === 'string') {
        next(); // Proceed if all fields are strings
    } else {
        res.status(400).json({error: 'Invalid request format. Expected fields: content, from, to (all strings)'});
    }
};

app.post('/send-message', validateMessageRequest, (req, res) => {
    const {content, from, to} = req.body;

    const responseData = {
        request: req.body,
        id: "12345",
        bulk_id: "bulk-6789",
        type: "sms",
        from: from,
        to: to,
        content: content,
        direction: "outbound",
        segments: 1,
        price: "0.10",
        status: "delivered",
        failure_reason: null,
        metadata: {source: "API"},
        scheduled_at: null,
        sent_at: new Date().toISOString(),
        delivered_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };

    res.json(responseData);
});

app.get('/status', (req, res) => {
    res.json({
        status: "Server is running",
        timestamp: new Date().toISOString()
    });
});

function jsonToXmlConversion(json) {
    const builder = new xml2js.Builder();
    return builder.buildObject(json);
}
app.use('/users', bodyParser.text({type: 'application/xml'}));
app.post('/users', async (req, res) => {
    const xmlData = req.body;

    xml2js.parseString(xmlData, {explicitArray: false}, async (err, result) => {
        if (err) {
            return res.status(400).json({error: 'Invalid XML format'});
        }
        const pin = result.Envelope.Body.ListCustomers.Query.PIN;
        const tax = result.Envelope.Body.ListCustomers.Query.TaxpayerId;
    
        

        if (!pin && !tax) {
            return res.status(400).json({error: 'PIN or TaxPayerId not found in the request'});
        }
        console.log("PIN: " + pin)
        let user;
        try {

            const url = pin?`http://localhost:3000/users?personalNumber=${pin}`:
                            `http://localhost:3000/companies?taxNumber=${tax}`
            const userResponse = await axios.get(url);

            user1 = userResponse.data;
            user = user1[0]
            console.log(user)
        } catch (error) {
            console.error(error);
            return res.status(500).json({error: 'Failed to fetch user data'});
        }
        if (user1.length === 0) {
            return res.status(500).json({error: 'Failed to fetch user data'});
        }
        const EntityUser = {
            Type: 'Taxpayer',
            PIN: pin,  // Use the extracted PIN
            Name: {
                FirstName: {
                    ValueGeo: user.name,
                    ValueLat: 'AVTANDYL'
                },
                LastName: {
                    ValueGeo: user.surname,
                    ValueLat: 'VERULEISHVILI'
                },
                FathersName: {
                    ValueGeo: 'მერაბი',
                    ValueLat: 'ZURABI'
                }
            },
            Citizenship: 'GE',
            DoubleCitizenshipCountry: 'NN',
            Gender: 'Male',
            BirthPlaceDateAndCountry: {
                Date: '1986-11-20T00:00:00',
                Country: 'GE',
                Place: 'თბილისი'
            },
            Subtype2: 117,
            DisabilitiesTypeId: 1
        }

        const EntityCompany = {
            Type: 'Legal',
            Subtype:6,
            LegalForm: "LLC",
            FoundationDate: "1997-03-21T00:00:00",
            SubTyoe2: "264",
            OrganizationTypeId: "შპს"
        }

        const responseData = {
            Envelope: {
                Header: {
                    ResponseHeaders: {
                        RequestId: '123',
                        Timestamp: '2024-10-16T16:30:29.8780756+04:00',
                        IsCopy: false,
                        ApiVersion: '9.15.0.0'
                    }
                },
                Body: {
                    ListCustomersResponse: {
                        Result: {
                            Customer: {
                                Id: 613949,
                                Version: 19,
                                Name: {
                                    ValueGeo: pin? `${user.name} ${user.surname}` : user.clientName,
                                    ValueLat: 'AVTANDYL VERULEISHVILI'
                                },
                                Status: user.status,
                                DeptId: 0,
                                BranchId: 0,
                                IsBankCustomer: true,
                                IsInsider: false,
                                IsResident: true,
                                IsCompleted: true,
                                IsAuthorized: true,
                                Country: 'GE',
                                ResponsibleUserId: 2090,
                                CustomerSince: '2023-05-16T00:00:00',
                                Note: 'FATCA. CRS (14/12/2023)',
                                TaxDetails: {
                                    TaxpayerId: pin ? user.personalNumber : user.taxNumber,
                                    City: 'თბილისი',
                                    Organization: 'შემოსავლების სამსახური',
                                    RegistrationDate: '2012-12-15T00:00:00',
                                    Country: 'GE',
                                    RegistrationNumber: 1010010182
                                },
                                Entity: pin ? EntityUser : EntityCompany,
                                CountryOfResidence: 'GE',
                                ChannelId: 0,
                                AmlStatus: 'Ok',
                                CustomershipKind: 'AccountOwner',
                                IsFetchedFromCra: false
                            }
                        },
                        LastIdEvaluated: ''
                    }
                }
            }
        };

        const xmlResponse = jsonToXmlConversion(responseData);
        res.setHeader('Content-Type', 'application/xml');
        res.send(xmlResponse);
    });
});



const PORT = 3001;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
