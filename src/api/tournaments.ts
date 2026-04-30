import { apiClient } from './client'
import { AxiosError } from 'axios'
import type {
  Tournament,
  TournamentTeam,
  TournamentMatch,
  Bracket,
  TournamentReport,
  TournamentStatus,
  TournamentFormat,
} from '@/types/tournament'

export async function getTournaments(params?: {
  status?: TournamentStatus
  format?: TournamentFormat
}): Promise<Tournament[]> {
  const { data } = await apiClient.get<Tournament[]>('/tournaments/manage/', { params })
  return data
}

export async function getTournament(id: number): Promise<Tournament> {
  const { data } = await apiClient.get<Tournament>(`/tournaments/${id}/`)
  return data
}

export async function createTournament(payload: Partial<Tournament>): Promise<Tournament> {
  const { data } = await apiClient.post<Tournament>('/tournaments/manage/create/', payload)
  return data
}

export async function updateTournament(id: number, payload: Partial<Tournament>): Promise<Tournament> {
  const { data } = await apiClient.patch<Tournament>(`/tournaments/manage/${id}/`, payload)
  return data
}

export async function changeTournamentStatus(id: number, status: TournamentStatus): Promise<{ id: number; status: TournamentStatus; status_display: string }> {
  const { data } = await apiClient.post(`/tournaments/manage/${id}/status/`, { status })
  return data
}

// Teams
export async function getTournamentTeams(tournamentId: number): Promise<TournamentTeam[]> {
  const { data } = await apiClient.get<TournamentTeam[]>(`/tournaments/${tournamentId}/teams/`)
  return data
}

export async function addTeam(tournamentId: number, payload: { player1_id: number; player2_id?: number; team_name?: string }): Promise<TournamentTeam> {
  const { data } = await apiClient.post<TournamentTeam>(`/tournaments/${tournamentId}/teams/`, payload)
  return data
}

export async function updateTeam(tournamentId: number, teamId: number, payload: Partial<TournamentTeam>): Promise<TournamentTeam> {
  const { data } = await apiClient.patch<TournamentTeam>(`/tournaments/${tournamentId}/teams/${teamId}/`, payload)
  return data
}

export async function confirmPayment(tournamentId: number, teamId: number, payment_method: string): Promise<TournamentTeam> {
  const { data } = await apiClient.post<TournamentTeam>(
    `/tournaments/manage/${tournamentId}/teams/${teamId}/confirm-payment/`,
    { payment_method }
  )
  return data
}

export async function refundTeam(tournamentId: number, teamId: number): Promise<{ detail: string; team_id: number }> {
  const { data } = await apiClient.post(`/tournaments/manage/${tournamentId}/teams/${teamId}/refund/`)
  return data
}

// Bracket
export async function generateBracket(tournamentId: number): Promise<{ detail: string; bracket: Bracket }> {
  const { data } = await apiClient.post(`/tournaments/manage/${tournamentId}/generate-bracket/`)
  return data
}

export async function getBracket(tournamentId: number): Promise<Bracket | null> {
  try {
    const { data } = await apiClient.get<Bracket>(`/tournaments/${tournamentId}/bracket/`)
    return data
  } catch (error) {
    if (error instanceof AxiosError && error.response?.status === 404) {
      return null
    }
    throw error
  }
}

// Matches
export async function getTournamentMatches(tournamentId: number, params?: { date?: string; court_id?: number; status?: string }): Promise<TournamentMatch[]> {
  const { data } = await apiClient.get<TournamentMatch[]>(`/tournaments/${tournamentId}/matches/`, { params })
  return data
}

export async function updateMatch(tournamentId: number, matchId: number, payload: Partial<TournamentMatch> & { winner?: number | null }): Promise<TournamentMatch> {
  const { data } = await apiClient.patch<TournamentMatch>(
    `/tournaments/manage/${tournamentId}/matches/${matchId}/`,
    payload
  )
  return data
}

// Report
export async function getTournamentReport(tournamentId: number): Promise<TournamentReport> {
  const { data } = await apiClient.get<TournamentReport>(`/tournaments/manage/${tournamentId}/report/`)
  return data
}
