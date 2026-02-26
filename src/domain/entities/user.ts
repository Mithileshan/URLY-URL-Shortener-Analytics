export type User = {
    id: string
    name: string
    email: string
    passwordHash: string
    createdAt: Date
}

export type AuthToken = {
    token: string
    user: Pick<User, 'id' | 'name' | 'email'>
}
