import { Injectable, signal, inject } from '@angular/core';
import { Session, User } from '@supabase/supabase-js';
import { UserProfile } from '../interfaces/user.interface';
import { SupabaseService } from './supabase.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private supabase = inject(SupabaseService).client;
  private _session = signal<Session | null>(null);
  private _userProfile = signal<UserProfile | null>(null);

  readonly session = this._session.asReadonly();
  readonly userProfile = this._userProfile.asReadonly();

  constructor() {
    this.supabase.auth.onAuthStateChange((event, session) => {
      this._session.set(session);

      if (session && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) {
        this.fetchUserProfile(session.user);
      } else if (event === 'SIGNED_OUT') {
        this._userProfile.set(null);
      }
    });
  }

  private async fetchUserProfile(user: User) {
    const { data, error } = await this.supabase
      .from('users')
      .select('role, full_name')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Error fetching user profile:', error);
    } else if (data) {
      const userProfile: UserProfile = {
        role: data.role,
        fullName: data.full_name,
      };
      this._userProfile.set(userProfile);
    }
  }

  async downloadUserProfile() {
    const user = this.user;
    if (!user) return;
    await this.fetchUserProfile(user);
  }

  async signIn(email: string, password: string) {
    const { error } = await this.supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }

  async register(email: string, password: string, fullName: string, role: string) {
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
    });
    if (error) throw error;

    const userId = data.user?.id;

    if (userId) {
      const { error: insertError } = await this.supabase.from('users').insert({
        id: userId,
        email,
        full_name: fullName,
        role,
      });
      if (insertError) throw insertError;
    }
  }

  async signOut() {
    const { error } = await this.supabase.auth.signOut();
    this._userProfile.set(null);
    if (error) throw error;
  }

  get user() {
    return this._session()?.user ?? null;
  }
}
