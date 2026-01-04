export const CONTACT = {
  firstName: "Anton",
  lastName: "Baus",
  email: "anton.baus@icloud.com",
  phone: "+491722425657",
  fax: "+493022004615",
  street: "Ansbacher Str. 63",
  postalCode: "10777",
  city: "Berlin",
  country: "DE",
  website: "https://baus-online.de",
};

export function buildVCard() {
  const c = CONTACT;

  // vCard 3.0 (максимальная совместимость iOS/Android)
  return [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `N:${c.lastName};${c.firstName};;;`,
    `FN:${c.firstName} ${c.lastName}`,
    `TEL;TYPE=CELL:${c.phone}`,
    `TEL;TYPE=FAX:${c.fax}`,
    `EMAIL;TYPE=INTERNET:${c.email}`,
    `URL:${c.website}`,
    `ADR;TYPE=HOME:;;${c.street};${c.city};;${c.postalCode};${c.country}`,
    "END:VCARD",
  ].join("\n");
}
