import type { Database } from './packages/db/src/index';

type IsNever<T> = [T] extends [never] ? true : false;

type PublicSchema = Database['public'];
type PublicTables = PublicSchema['Tables'];
type ProfilesTable = PublicTables['profiles'];
type ProfilesRow = ProfilesTable['Row'];

// Try to access role from ProfilesRow
type RoleType = ProfilesRow['role'];

// Check if the whole chain is never at any point
type CheckPublicSchema = IsNever<PublicSchema>;
type CheckTables = IsNever<PublicTables>;
type CheckProfiles = IsNever<ProfilesTable>;
type CheckRow = IsNever<ProfilesRow>;
type CheckRole = IsNever<RoleType>;

const a: CheckPublicSchema = false;
const b: CheckTables = false;
const c: CheckProfiles = false;
const d: CheckRow = false;
const e: CheckRole = false;
