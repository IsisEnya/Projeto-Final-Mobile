import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Academy,
  AcademyMembership,
  AppNotification,
  MembershipStatus,
  NotificationType,
  User,
} from '../types';

type CreateAcademyData = {
  ownerUserId: string;
  name: string;
  email: string;
  phone?: string;
  logo?: string;
  description?: string;
  address?: string;
  city: string;
  state: string;
  country?: string;
  instagram?: string;
  status?: Academy['status'];
};

class AcademyService {
  private readonly ACADEMIES_KEY = 'academies_data';
  private readonly MEMBERSHIPS_KEY = 'academy_memberships_data';
  private readonly NOTIFICATIONS_KEY = 'notifications_data';
  private readonly USERS_KEY = 'users_data';

  async createAcademy(data: CreateAcademyData): Promise<Academy> {
    const academies = await this.getAcademies();
    const existingAcademy = academies.find((academy) => academy.ownerUserId === data.ownerUserId);

    if (existingAcademy) {
      const updatedAcademy = { ...existingAcademy, ...this.mapAcademyData(data, existingAcademy.id) };
      await this.saveAcademies(
        academies.map((academy) => (academy.id === updatedAcademy.id ? updatedAcademy : academy))
      );
      return updatedAcademy;
    }

    const academy: Academy = {
      ...this.mapAcademyData(data, `academy-${Date.now()}`),
      createdAt: new Date().toISOString(),
      status: data.status ?? 'active',
    };

    await this.saveAcademies([academy, ...academies]);
    return academy;
  }

  async editAcademy(ownerUserId: string, academyId: string, data: Partial<Academy>): Promise<Academy> {
    const academies = await this.getAcademies();
    const academy = academies.find((item) => item.id === academyId);

    if (!academy) throw new Error('Academia nao encontrada');
    this.assertAcademyOwner(academy, ownerUserId);

    const updatedAcademy = { ...academy, ...data, id: academy.id, ownerUserId: academy.ownerUserId };
    await this.saveAcademies(
      academies.map((item) => (item.id === academyId ? updatedAcademy : item))
    );
    return updatedAcademy;
  }

  async searchAcademiesByName(query: string, userId?: string) {
    const academies = await this.getAcademies();
    const memberships = userId ? await this.getMemberships() : [];
    const normalizedQuery = query.trim().toLowerCase();

    return academies
      .filter((academy) => academy.status === 'active')
      .filter((academy) => academy.name.toLowerCase().includes(normalizedQuery))
      .map((academy) => {
        const membership = memberships.find(
          (item) => item.userId === userId && item.academyId === academy.id
        );

        return {
          id: academy.id,
          name: academy.name,
          logo: academy.logo,
          city: academy.city,
          state: academy.state,
          membershipStatus: membership?.status ?? 'none',
        };
      });
  }

  async requestMembership(userId: string, academyId: string): Promise<AcademyMembership> {
    const academy = await this.getAcademyById(academyId);
    if (!academy) throw new Error('Academia nao encontrada');

    const memberships = await this.getMemberships();
    const existingMembership = memberships.find(
      (membership) =>
        membership.userId === userId &&
        membership.academyId === academyId &&
        ['pending', 'approved'].includes(membership.status)
    );

    if (existingMembership) {
      throw new Error('Ja existe uma solicitacao ou vinculo com essa academia');
    }

    const now = new Date().toISOString();
    const membership: AcademyMembership = {
      id: `membership-${Date.now()}`,
      userId,
      academyId,
      status: 'pending',
      requestedAt: now,
    };

    await this.saveMemberships([membership, ...memberships]);
    await this.createNotification({
      recipientId: academy.ownerUserId,
      type: 'membership-requested',
      title: 'Nova solicitacao de vinculo',
      message: 'Um aluno solicitou vinculo com sua academia.',
      relatedUserId: userId,
      relatedAcademyId: academyId,
    });

    return membership;
  }

  async listPendingRequests(academyOwnerUserId: string, academyId: string) {
    const academy = await this.getAcademyById(academyId);
    if (!academy) throw new Error('Academia nao encontrada');
    this.assertAcademyOwner(academy, academyOwnerUserId);

    const memberships = await this.getMemberships();
    const users = await this.getUsers();

    return memberships
      .filter((membership) => membership.academyId === academyId && membership.status === 'pending')
      .map((membership) => ({
        membership,
        user: users.find((user) => user.id === membership.userId),
      }));
  }

  async approveMembership(ownerUserId: string, membershipId: string): Promise<AcademyMembership> {
    return this.resolveMembership(ownerUserId, membershipId, 'approved');
  }

  async rejectMembership(ownerUserId: string, membershipId: string): Promise<AcademyMembership> {
    return this.resolveMembership(ownerUserId, membershipId, 'rejected');
  }

  async listApprovedStudents(ownerUserId: string, academyId: string) {
    const academy = await this.getAcademyById(academyId);
    if (!academy) throw new Error('Academia nao encontrada');
    this.assertAcademyOwner(academy, ownerUserId);

    const memberships = await this.getMemberships();
    const users = await this.getUsers();

    return memberships
      .filter((membership) => membership.academyId === academyId && membership.status === 'approved')
      .map((membership) => ({
        membership,
        user: users.find((user) => user.id === membership.userId),
      }));
  }

  async leaveAcademy(userId: string, academyId: string): Promise<AcademyMembership> {
    const memberships = await this.getMemberships();
    const membership = memberships.find(
      (item) => item.userId === userId && item.academyId === academyId && item.status === 'approved'
    );
    const academy = await this.getAcademyById(academyId);

    if (!membership || !academy) throw new Error('Vinculo aprovado nao encontrado');

    const updatedMembership = {
      ...membership,
      status: 'removed' as MembershipStatus,
      removedAt: new Date().toISOString(),
    };

    await this.saveMemberships(
      memberships.map((item) => (item.id === membership.id ? updatedMembership : item))
    );
    await this.updateUserAcademy(userId);
    await this.createNotification({
      recipientId: academy.ownerUserId,
      type: 'membership-left',
      title: 'Aluno saiu da academia',
      message: 'Um aluno removeu o vinculo com sua academia.',
      relatedUserId: userId,
      relatedAcademyId: academyId,
    });

    return updatedMembership;
  }

  async removeStudent(ownerUserId: string, membershipId: string): Promise<AcademyMembership> {
    const memberships = await this.getMemberships();
    const membership = memberships.find((item) => item.id === membershipId);
    if (!membership) throw new Error('Vinculo nao encontrado');

    const academy = await this.getAcademyById(membership.academyId);
    if (!academy) throw new Error('Academia nao encontrada');
    this.assertAcademyOwner(academy, ownerUserId);

    const updatedMembership = {
      ...membership,
      status: 'removed' as MembershipStatus,
      removedAt: new Date().toISOString(),
    };

    await this.saveMemberships(
      memberships.map((item) => (item.id === membershipId ? updatedMembership : item))
    );
    await this.updateUserAcademy(membership.userId);
    await this.createNotification({
      recipientId: membership.userId,
      type: 'membership-removed',
      title: 'Vinculo removido',
      message: `${academy.name} removeu seu vinculo com a academia.`,
      relatedUserId: membership.userId,
      relatedAcademyId: academy.id,
    });

    return updatedMembership;
  }

  async listNotifications(userId: string): Promise<AppNotification[]> {
    const notifications = await this.getNotifications();
    return notifications
      .filter((notification) => notification.recipientId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async markNotificationAsRead(userId: string, notificationId: string): Promise<AppNotification> {
    const notifications = await this.getNotifications();
    const notification = notifications.find((item) => item.id === notificationId);

    if (!notification || notification.recipientId !== userId) {
      throw new Error('Notificacao nao encontrada');
    }

    const updatedNotification = { ...notification, read: true };
    await this.saveNotifications(
      notifications.map((item) => (item.id === notificationId ? updatedNotification : item))
    );
    return updatedNotification;
  }

  async getAcademyByOwner(ownerUserId: string): Promise<Academy | null> {
    const academies = await this.getAcademies();
    return academies.find((academy) => academy.ownerUserId === ownerUserId) ?? null;
  }

  async getApprovedMembershipForUser(userId: string): Promise<AcademyMembership | null> {
    const memberships = await this.getMemberships();
    return memberships.find((membership) => membership.userId === userId && membership.status === 'approved') ?? null;
  }

  private async resolveMembership(
    ownerUserId: string,
    membershipId: string,
    status: 'approved' | 'rejected'
  ): Promise<AcademyMembership> {
    const memberships = await this.getMemberships();
    const membership = memberships.find((item) => item.id === membershipId);
    if (!membership) throw new Error('Solicitacao nao encontrada');

    const academy = await this.getAcademyById(membership.academyId);
    if (!academy) throw new Error('Academia nao encontrada');
    this.assertAcademyOwner(academy, ownerUserId);

    const now = new Date().toISOString();
    const updatedMembership: AcademyMembership = {
      ...membership,
      status,
      approvedAt: status === 'approved' ? now : membership.approvedAt,
      rejectedAt: status === 'rejected' ? now : membership.rejectedAt,
    };

    await this.saveMemberships(
      memberships.map((item) => (item.id === membershipId ? updatedMembership : item))
    );

    if (status === 'approved') {
      await this.updateUserAcademy(membership.userId, academy);
    }

    await this.createNotification({
      recipientId: membership.userId,
      type: status === 'approved' ? 'membership-approved' : 'membership-rejected',
      title: status === 'approved' ? 'Solicitacao aprovada' : 'Solicitacao recusada',
      message:
        status === 'approved'
          ? `${academy.name} aprovou seu vinculo.`
          : `${academy.name} recusou seu vinculo.`,
      relatedUserId: membership.userId,
      relatedAcademyId: academy.id,
    });

    return updatedMembership;
  }

  private async createNotification(data: Omit<AppNotification, 'id' | 'read' | 'createdAt'>) {
    const notifications = await this.getNotifications();
    const notification: AppNotification = {
      ...data,
      id: `notification-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      read: false,
      createdAt: new Date().toISOString(),
    };
    await this.saveNotifications([notification, ...notifications]);
    return notification;
  }

  private async updateUserAcademy(userId: string, academy?: Academy) {
    const users = await this.getUsers();
    const updatedUsers = users.map((user) => {
      if (user.id !== userId) return user;
      return {
        ...user,
        academyId: academy?.id,
        academyName: academy?.name,
      };
    });

    await AsyncStorage.setItem(this.USERS_KEY, JSON.stringify(updatedUsers));
  }

  private async getAcademyById(academyId: string) {
    const academies = await this.getAcademies();
    return academies.find((academy) => academy.id === academyId) ?? null;
  }

  private assertAcademyOwner(academy: Academy, ownerUserId: string) {
    if (academy.ownerUserId !== ownerUserId) {
      throw new Error('Voce nao tem permissao para administrar esta academia');
    }
  }

  private mapAcademyData(data: CreateAcademyData, id: string): Academy {
    return {
      id,
      ownerUserId: data.ownerUserId,
      name: data.name,
      email: data.email,
      phone: data.phone,
      logo: data.logo,
      description: data.description,
      address: data.address ?? '',
      city: data.city,
      state: data.state,
      country: data.country ?? 'Brasil',
      instagram: data.instagram,
      createdAt: new Date().toISOString(),
      status: data.status ?? 'active',
    };
  }

  private async getAcademies(): Promise<Academy[]> {
    const academiesJson = await AsyncStorage.getItem(this.ACADEMIES_KEY);
    return academiesJson ? JSON.parse(academiesJson) : [];
  }

  private async saveAcademies(academies: Academy[]) {
    await AsyncStorage.setItem(this.ACADEMIES_KEY, JSON.stringify(academies));
  }

  private async getMemberships(): Promise<AcademyMembership[]> {
    const membershipsJson = await AsyncStorage.getItem(this.MEMBERSHIPS_KEY);
    return membershipsJson ? JSON.parse(membershipsJson) : [];
  }

  private async saveMemberships(memberships: AcademyMembership[]) {
    await AsyncStorage.setItem(this.MEMBERSHIPS_KEY, JSON.stringify(memberships));
  }

  private async getNotifications(): Promise<AppNotification[]> {
    const notificationsJson = await AsyncStorage.getItem(this.NOTIFICATIONS_KEY);
    return notificationsJson ? JSON.parse(notificationsJson) : [];
  }

  private async saveNotifications(notifications: AppNotification[]) {
    await AsyncStorage.setItem(this.NOTIFICATIONS_KEY, JSON.stringify(notifications));
  }

  private async getUsers(): Promise<User[]> {
    const usersJson = await AsyncStorage.getItem(this.USERS_KEY);
    return usersJson ? JSON.parse(usersJson) : [];
  }
}

export const academyService = new AcademyService();
