export interface CourseFavoritesRepository {
  add(params: { publicUserId: string; courseId: string }): Promise<void>;

  remove(params: { publicUserId: string; courseId: string }): Promise<void>;

  existsByUserAndCourse(params: {
    publicUserId: string;
    courseId: string;
  }): Promise<boolean>;

  /**
   * Lista todos los cursos marcados como favoritos por un usuario público.
   */
  listForUser(publicUserId: string): Promise<any[]>;
}
