"""
Script de prueba y creación automática de la base de datos PostgreSQL.
"""

import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

DB_USER = "postgres"
DB_PASS = "12345"
DB_HOST = "localhost"
DB_PORT = "5432"
TARGET_DB = "fraudguard_db"

def test_and_setup_postgres():
    print(f"[*] Probando conexión con servidor PostgreSQL en {DB_HOST}:{DB_PORT}...")
    try:
        # 1. Conectar a la base de datos por defecto 'postgres'
        conn = psycopg2.connect(
            user=DB_USER,
            password=DB_PASS,
            host=DB_HOST,
            port=DB_PORT,
            dbname="postgres"
        )
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cursor = conn.cursor()
        print("    [OK] Conexión al servidor PostgreSQL exitosa con usuario 'postgres'.")

        # 2. Verificar si la base de datos 'fraudguard_db' existe
        cursor.execute("SELECT 1 FROM pg_database WHERE datname = %s;", (TARGET_DB,))
        exists = cursor.fetchone()

        if not exists:
            print(f"[*] Creando base de datos '{TARGET_DB}'...")
            cursor.execute(f'CREATE DATABASE "{TARGET_DB}";')
            print(f"    [OK] Base de datos '{TARGET_DB}' creada exitosamente.")
        else:
            print(f"    [OK] La base de datos '{TARGET_DB}' ya existe en el servidor.")

        cursor.close()
        conn.close()

        # 3. Probar conexión directa a 'fraudguard_db'
        print(f"[*] Probando conexión directa a '{TARGET_DB}'...")
        conn_target = psycopg2.connect(
            user=DB_USER,
            password=DB_PASS,
            host=DB_HOST,
            port=DB_PORT,
            dbname=TARGET_DB
        )
        conn_target.close()
        print(f"    [OK] Conexión directa a '{TARGET_DB}' verificada y 100% funcional.")
        return True

    except Exception as e:
        print(f"    [!] Error al conectar con PostgreSQL: {e}")
        return False

if __name__ == "__main__":
    test_and_setup_postgres()
