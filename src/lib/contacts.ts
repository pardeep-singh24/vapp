import { Capacitor } from "@capacitor/core";

/** Contact Picker API (Chrome / some WebViews). */
function supportsWebContactPicker(): boolean {
  return typeof navigator !== "undefined" && "contacts" in navigator;
}

export function supportsContactPicker(): boolean {
  return Capacitor.isNativePlatform() || supportsWebContactPicker();
}

async function pickViaWeb(): Promise<{ name: string; phone?: string } | null> {
  if (!supportsWebContactPicker()) return null;

  type PickedContact = { name?: string[]; tel?: string[] };
  const contacts = (await (
    navigator as Navigator & {
      contacts: { select: (props: string[], opts?: { multiple?: boolean }) => Promise<PickedContact[]> };
    }
  ).contacts.select(["name", "tel"], { multiple: false })) as PickedContact[];

  const picked = contacts[0];
  if (!picked) return null;

  const name = picked.name?.[0]?.trim();
  if (!name) return null;

  return { name, phone: picked.tel?.[0]?.trim() || undefined };
}

async function pickViaCapacitor(): Promise<{ name: string; phone?: string } | null> {
  const { Contacts } = await import("@capacitor-community/contacts");
  const permission = await Contacts.requestPermissions();
  if (permission.contacts !== "granted") return null;

  const { contact } = await Contacts.pickContact({ projection: { name: true, phones: true } });
  const name = contact.name?.display?.trim() || contact.name?.given?.trim();
  if (!name) return null;

  const phone = contact.phones?.[0]?.number?.trim();
  return { name, phone: phone || undefined };
}

export async function pickContact(): Promise<{ name: string; phone?: string } | null> {
  if (Capacitor.isNativePlatform()) {
    return pickViaCapacitor();
  }
  return pickViaWeb();
}
