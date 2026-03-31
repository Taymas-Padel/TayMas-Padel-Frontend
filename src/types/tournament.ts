export type TournamentStatus = 'DRAFT' | 'REGISTRATION' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELED'
export type TournamentFormat = 'DOUBLES' | 'SINGLES'
export type TeamStatus = 'PENDING' | 'CONFIRMED' | 'PAID' | 'WITHDRAWN' | 'REFUNDED'
export type MatchStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'POSTPONED' | 'WALKOVER'

export interface Tournament {
  id: number
  name: string
  description: string | null
  start_date: string
  end_date: string
  registration_deadline: string
  status: TournamentStatus
  format: TournamentFormat
  is_paid: boolean
  entry_fee: string
  max_teams: number | null
  teams_count: number
  paid_teams_count: number
  prize_info: string | null
  created_at: string
  created_by?: number
  created_by_info?: { id: number; name: string; phone: string | null }
  updated_at?: string
}

export interface PlayerInfo {
  id: number
  name: string
  phone: string | null
}

export interface TournamentTeam {
  id: number
  tournament: number
  display_name: string
  team_name: string
  player1: number
  player1_info: PlayerInfo
  player2: number | null
  player2_info: PlayerInfo | null
  status: TeamStatus
  seed: number | null
  registered_at: string
  confirmed_at: string | null
  paid_at: string | null
  paid_by_info: PlayerInfo | null
  payment_method: string | null
  notes: string
}

export interface TournamentMatch {
  id: number
  round_number: number
  round_name: string
  match_number: number
  team1: number | null
  team1_info: TournamentTeam | null
  team2: number | null
  team2_info: TournamentTeam | null
  winner: number | null
  winner_info: TournamentTeam | null
  court: number | null
  court_name: string | null
  scheduled_at: string | null
  status: MatchStatus
  score_team1: string
  score_team2: string
  next_match: number | null
  notes: string
}

export interface BracketRound {
  round_number: number
  round_name: string
  matches: TournamentMatch[]
}

export interface Bracket {
  tournament_id: number
  total_rounds: number
  rounds: BracketRound[]
}

export interface TournamentReport {
  tournament: Tournament
  total_teams: number
  paid_teams: number
  withdrawn_teams: number
  revenue: number
  winner: TournamentTeam | null
  teams: Array<{
    team: TournamentTeam
    matches_played: number
    won: number
  }>
}
