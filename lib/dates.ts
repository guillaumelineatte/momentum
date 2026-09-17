import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  addDays,
  subDays,
  addMonths,
  subMonths,
  isSameDay,
  isSameMonth,
  isToday as isTodayFns,
  format,
  parseISO,
  isValid,
} from 'date-fns'
import { fr } from 'date-fns/locale'

export const DATE_PARAM_FORMAT = 'yyyy-MM-dd'

export function parseDateParam(value?: string): Date {
  if (!value) return startOfDay(new Date())
  const parsed = parseISO(value)
  return isValid(parsed) ? startOfDay(parsed) : startOfDay(new Date())
}

export function formatDateParam(date: Date): string {
  return format(date, DATE_PARAM_FORMAT)
}

export function jourRange(date: Date) {
  return { debut: startOfDay(date), fin: endOfDay(date) }
}

/** Les 7 jours (lundi -> dimanche) de la semaine contenant `date`. */
export function semaineDe(date: Date): Date[] {
  const debut = startOfWeek(date, { weekStartsOn: 1 })
  const fin = endOfWeek(date, { weekStartsOn: 1 })
  return eachDayOfInterval({ start: debut, end: fin })
}

/** Grille mensuelle complète (semaines pleines lundi -> dimanche, jours des mois adjacents inclus). */
export function grilleMoisDe(date: Date): Date[] {
  const debutMois = startOfMonth(date)
  const finMois = endOfMonth(date)
  const debut = startOfWeek(debutMois, { weekStartsOn: 1 })
  const fin = endOfWeek(finMois, { weekStartsOn: 1 })
  return eachDayOfInterval({ start: debut, end: fin })
}

export { addDays, subDays, isSameDay, isSameMonth, startOfMonth, endOfMonth, startOfDay, endOfDay }

export const MONTH_PARAM_FORMAT = 'yyyy-MM'

export function parseMoisParam(value?: string): Date {
  if (!value) return startOfMonth(new Date())
  const parsed = parseISO(`${value}-01`)
  return isValid(parsed) ? startOfMonth(parsed) : startOfMonth(new Date())
}

export function formatMoisParam(date: Date): string {
  return format(date, MONTH_PARAM_FORMAT)
}

export function moisSuivant(date: Date): Date {
  return startOfMonth(addMonths(date, 1))
}

export function moisPrecedent(date: Date): Date {
  return startOfMonth(subMonths(date, 1))
}

export function isToday(date: Date): boolean {
  return isTodayFns(date)
}

export function labelJourCourt(date: Date): string {
  return format(date, 'EEE', { locale: fr }).toUpperCase().replace('.', '')
}

export function labelJourLong(date: Date): string {
  const brut = format(date, 'EEEE d MMMM', { locale: fr })
  return brut.charAt(0).toUpperCase() + brut.slice(1)
}

export function labelJourLongAvecAnnee(date: Date): string {
  const brut = format(date, 'EEEE d MMMM yyyy', { locale: fr })
  return brut.charAt(0).toUpperCase() + brut.slice(1)
}

export function labelMois(date: Date): string {
  const brut = format(date, 'MMMM yyyy', { locale: fr })
  return brut.charAt(0).toUpperCase() + brut.slice(1)
}
