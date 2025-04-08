---- יצירת בסיס נתונים
CREATE DATABASE FamilyDB1;

---- בחר את בסיס הנתונים החדש
USE FamilyDB1;
DROP DATABASE FamilyDB1
--הגדרת טבלה People
--DROP TABLE  Family_Relations
--DROP TABLE People
CREATE TABLE People (
    Person_Id VARCHAR(9) PRIMARY KEY,
    Personal_Name VARCHAR(20) NOT NULL,
    Family_Name VARCHAR(20) NOT NULL,
    Gender NVARCHAR(10) CHECK (Gender IN ('M','F')) NOT NULL,
    Father_Id VARCHAR(9) NULL,
    Mother_Id VARCHAR(9)NULL,
    Spouse_Id VARCHAR(9)NULL,

--בדיקת שדה תז ל9 ספרות בהנחה שזה מספיק ואין צורך לבדיקה של תקינות תעודת זהות
	CONSTRAINT chk_person_id CHECK (LEN(Person_Id) = 9 AND Person_Id NOT LIKE '%[^0-9]%'),

--שלא יהיה ניתן להגדיר שאדם הוא בין זוג של עצמו 
    CONSTRAINT chk_spouse_not_self CHECK (Person_Id <> Spouse_Id),
--יתכן ואין צורך להגדיר את השדות הבאים כמפתחות זרים, תלוי לפי הצורך
    FOREIGN KEY (Father_Id) REFERENCES People(Person_Id) ,
    FOREIGN KEY (Mother_Id) REFERENCES People(Person_Id) ,
    FOREIGN KEY (Spouse_Id) REFERENCES People(Person_Id)
);
GO

---------------------------------------------------------
------תרגיל‌ 1  הקמת עץ משפחה

CREATE TABLE Family_Relations (
    Person_Id VARCHAR(9) NOT NULL,
    Relative_Id VARCHAR(9) NOT NULL,
    Connection_Type VARCHAR(7) CHECK (Connection_Type IN 
        ('Father', 'Mother', 'Son', 'Daughter', 'Brother', 'Sister', 'Spouse')),
    PRIMARY KEY (Person_Id, Relative_Id, Connection_Type),
    FOREIGN KEY (Person_Id) REFERENCES People(Person_Id) ,
    FOREIGN KEY (Relative_Id) REFERENCES People(Person_Id) 
);
GO
--DROP TRIGGER trg_InsertRelations
---------------------------------------
--קודם כל עדכון למקרה שכבר התקבלה טבלה אם נתוני בני זוג חסרים
---------------------------------------
DECLARE @context VARBINARY(128) = CONVERT(VARBINARY(128), 'PeopleTrigger');
SET CONTEXT_INFO @context;

--  עדכון סימטרי בטבלת People – תיקון חד צדדי
-- עדכון עבור בני זוג שמוגדרים באחד הצדדים אך לא בשני
UPDATE p2
SET p2.Spouse_Id = p1.Person_Id
FROM People p1
JOIN People p2 ON p1.Spouse_Id = p2.Person_Id
WHERE p2.Spouse_Id IS NULL AND p1.Spouse_Id IS NOT NULL;


--  הוספת קשרים דו-כיווניים בטבלת Family_Relations במידת הצורך
-- קשר מהרשומה לבן/בת הזוג
INSERT INTO Family_Relations (Person_Id, Relative_Id, Connection_Type)
SELECT p1.Person_Id, p1.Spouse_Id, 'Spouse'
FROM People p1
JOIN People p2 ON p1.Spouse_Id = p2.Person_Id
WHERE p1.Spouse_Id IS NOT NULL
AND NOT EXISTS (
    SELECT 1 FROM Family_Relations fr
    WHERE fr.Person_Id = p1.Person_Id AND fr.Relative_Id = p1.Spouse_Id AND fr.Connection_Type = 'Spouse'
);

-- קשר מהבן/בת זוג לרשומה
INSERT INTO Family_Relations (Person_Id, Relative_Id, Connection_Type)
SELECT p1.Spouse_Id, p1.Person_Id, 'Spouse'
FROM People p1
JOIN People p2 ON p1.Spouse_Id = p2.Person_Id
WHERE p1.Spouse_Id IS NOT NULL
AND NOT EXISTS (
    SELECT 1 FROM Family_Relations fr
    WHERE fr.Person_Id = p1.Spouse_Id AND fr.Relative_Id = p1.Person_Id AND fr.Connection_Type = 'Spouse'
);
CREATE TRIGGER trg_InsertRelations
ON People
AFTER INSERT
AS
BEGIN
	DECLARE @context VARBINARY(128) = CONVERT(VARBINARY(128), 'PeopleTrigger');
	SET CONTEXT_INFO @context;
    -- לוודא שלא ניתן להכניס בן זוג אם לבן הזוג החדש כבר יש בן זוג אחר
     IF EXISTS (
        SELECT 1
        FROM inserted i
        INNER JOIN People p ON i.Spouse_Id = p.Person_Id
        WHERE i.Spouse_Id IS NOT NULL
          AND p.Spouse_Id IS NOT NULL
          AND p.Spouse_Id <> i.Person_Id -- לא מתייחס למקרה שבו הם כבר בני זוג
    )
    BEGIN
        RAISERROR('בן הזוג שבחרת כבר משויך למישהו אחר. לא ניתן להוסיף את הרשומה.', 16, 1);
        ROLLBACK TRANSACTION;
        RETURN;
    END;
	--UPDATE People
    --SET Spouse_Id = NULL
    --WHERE Person_Id IN (
    --    SELECT i.Person_Id
    --    FROM inserted i
    --    INNER JOIN People p ON i.Spouse_Id = p.Person_Id
    --    WHERE p.Spouse_Id IS NOT NULL
    --);

    -- עדכון בן זוג רק אם בן הזוג השני פנוי (כלומר, אם Spouse_Id שלו הוא NULL)
    UPDATE p
    SET p.Spouse_Id = i.Person_Id
    FROM People p
    INNER JOIN inserted i ON p.Person_Id = i.Spouse_Id
    WHERE p.Spouse_Id IS NULL AND i.Spouse_Id IS NOT NULL;


	 -- הוספת קשרי בני זוג (דו-כיווני) **רק אם לבן הזוג אין כבר בן/בת זוג אחר**
    INSERT INTO Family_Relations (Person_Id, Relative_Id, Connection_Type)
    SELECT i.Person_Id, i.Spouse_Id, 'Spouse'
    FROM inserted i
    INNER JOIN People p ON i.Spouse_Id = p.Person_Id
    LEFT JOIN Family_Relations fr ON fr.Person_Id = i.Person_Id AND fr.Relative_Id = i.Spouse_Id AND fr.Connection_Type = 'Spouse'
    WHERE i.Spouse_Id IS NOT NULL
    AND fr.Person_Id IS NULL
    --AND p.Spouse_Id IS NULL; -- רק אם אין לו כבר בן זוג אחר

    INSERT INTO Family_Relations (Person_Id, Relative_Id, Connection_Type)
    SELECT i.Spouse_Id, i.Person_Id, 'Spouse'
    FROM inserted i
    INNER JOIN People p ON i.Spouse_Id = p.Person_Id
    LEFT JOIN Family_Relations fr ON fr.Person_Id = i.Spouse_Id AND fr.Relative_Id = i.Person_Id AND fr.Connection_Type = 'Spouse'
    WHERE i.Spouse_Id IS NOT NULL
    AND fr.Person_Id IS NULL
    --AND p.Spouse_Id IS NULL; -- רק אם אין לו כבר בן זוג אחר
    -- הוספת קשרי הורים (ילד -> הורה) אם לא קיימת שורה כזו
    INSERT INTO Family_Relations (Person_Id, Relative_Id, Connection_Type)
    SELECT i.Person_Id, i.Father_Id, 'Father'
    FROM inserted i
    LEFT JOIN Family_Relations fr ON fr.Person_Id = i.Person_Id AND fr.Relative_Id = i.Father_Id AND fr.Connection_Type = 'Father'
    WHERE i.Father_Id IS NOT NULL
    AND fr.Person_Id IS NULL;

    INSERT INTO Family_Relations (Person_Id, Relative_Id, Connection_Type)
    SELECT i.Person_Id, i.Mother_Id, 'Mother'
    FROM inserted i
    LEFT JOIN Family_Relations fr ON fr.Person_Id = i.Person_Id AND fr.Relative_Id = i.Mother_Id AND fr.Connection_Type = 'Mother'
    WHERE i.Mother_Id IS NOT NULL
    AND fr.Person_Id IS NULL;

    -- הוספת קשרי הורים (הורה -> ילד) אם לא קיימת שורה כזו
    INSERT INTO Family_Relations (Person_Id, Relative_Id, Connection_Type)
    SELECT i.Father_Id, i.Person_Id, CASE i.Gender WHEN 'M' THEN 'Son' ELSE 'Daughter' END
    FROM inserted i
    LEFT JOIN Family_Relations fr ON fr.Person_Id = i.Father_Id AND fr.Relative_Id = i.Person_Id AND fr.Connection_Type = 'Son'
    WHERE i.Father_Id IS NOT NULL
    AND fr.Person_Id IS NULL;

    INSERT INTO Family_Relations (Person_Id, Relative_Id, Connection_Type)
    SELECT i.Mother_Id, i.Person_Id, CASE i.Gender WHEN 'M' THEN 'Son' ELSE 'Daughter' END
    FROM inserted i
    LEFT JOIN Family_Relations fr ON fr.Person_Id = i.Mother_Id AND fr.Relative_Id = i.Person_Id AND fr.Connection_Type = 'Son'
    WHERE i.Mother_Id IS NOT NULL
    AND fr.Person_Id IS NULL;

   

    -- הוספת קשרי אחים ואחיות (דו-כיווני)
    INSERT INTO Family_Relations (Person_Id, Relative_Id, Connection_Type)
    SELECT i.Person_Id, p.Person_Id, CASE p.Gender WHEN 'M' THEN 'Brother' ELSE 'Sister' END
    FROM inserted i
    INNER JOIN People p ON (p.Father_Id = i.Father_Id OR p.Mother_Id = i.Mother_Id)
    LEFT JOIN Family_Relations fr ON fr.Person_Id = i.Person_Id AND fr.Relative_Id = p.Person_Id AND fr.Connection_Type IN ('Brother', 'Sister')
    WHERE p.Person_Id <> i.Person_Id
    AND (i.Father_Id IS NOT NULL OR i.Mother_Id IS NOT NULL)
    AND fr.Person_Id IS NULL;

    INSERT INTO Family_Relations (Person_Id, Relative_Id, Connection_Type)
    SELECT p.Person_Id, i.Person_Id, CASE i.Gender WHEN 'M' THEN 'Brother' ELSE 'Sister' END
    FROM inserted i
    INNER JOIN People p ON (p.Father_Id = i.Father_Id OR p.Mother_Id = i.Mother_Id)
    LEFT JOIN Family_Relations fr ON fr.Person_Id = p.Person_Id AND fr.Relative_Id = i.Person_Id AND fr.Connection_Type IN ('Brother', 'Sister')
    WHERE p.Person_Id <> i.Person_Id
    AND (i.Father_Id IS NOT NULL OR i.Mother_Id IS NOT NULL)
    AND fr.Person_Id IS NULL;
END;
--DELETE TRIGER trg_OnDeletePeople;

CREATE TRIGGER trg_OnDeletePeople
ON People
INSTEAD OF DELETE
AS
BEGIN
	DECLARE @context VARBINARY(128) = CONVERT(VARBINARY(128), 'PeopleTrigger');
	SET CONTEXT_INFO @context;
    -- 1️⃣ הפיכת מזהים בטבלת People ל-NULL אם האדם שנמחק היה אבא, אמא או בן זוג
    UPDATE People
    SET Father_Id = NULL
    WHERE Father_Id IN (SELECT Person_Id FROM deleted);

    UPDATE People
    SET Mother_Id = NULL
    WHERE Mother_Id IN (SELECT Person_Id FROM deleted);

    UPDATE People
    SET Spouse_Id = NULL
    WHERE Spouse_Id IN (SELECT Person_Id FROM deleted);

    -- 2️⃣ מחיקת כל הרשומות ב-Family_Relations שבהן האדם מופיע
    DELETE FROM Family_Relations 
    WHERE Person_Id IN (SELECT Person_Id FROM deleted)
       OR Relative_Id IN (SELECT Person_Id FROM deleted);

    -- 3️⃣ מחיקת האדם עצמו מטבלת People
    DELETE FROM People WHERE Person_Id IN (SELECT Person_Id FROM deleted);
END;
GO
--להוסיף טריגר שימנע מחיקה מטבלת הקשרים
--DROP TRIGGER trg_UpdatePeople;




CREATE TRIGGER trg_UpdatePeople
ON People
INSTEAD OF UPDATE
AS
BEGIN
	DECLARE @context VARBINARY(128) = CONVERT(VARBINARY(128), 'PeopleTrigger');
	SET CONTEXT_INFO @context;
    SET NOCOUNT ON;
	 -- חסימת עדכון אבא אם כבר קיים ערך
    IF UPDATE(Father_Id)
    BEGIN
        -- חסימה אם מנסים לשנות אבא שכבר הוגדר
        IF EXISTS (
            SELECT 1
            FROM inserted i
            INNER JOIN deleted d ON i.Person_Id = d.Person_Id
            WHERE d.Father_Id IS NOT NULL AND i.Father_Id <> d.Father_Id
        )
        BEGIN
            RAISERROR('לא ניתן לשנות את האב לאחר שהוגדר', 16, 1);
            ROLLBACK TRANSACTION;
            RETURN;
        END
        
        -- בדיקה שהאדם שהוגדר כאבא הוא זכר
        IF EXISTS (
            SELECT 1
            FROM inserted i
            INNER JOIN People p ON i.Father_Id = p.Person_Id
            WHERE p.Gender <> 'M'
        )
        BEGIN
            RAISERROR('האב חייב להיות זכר', 16, 1);
            ROLLBACK TRANSACTION;
            RETURN;
        END

        -- חסימה אם מישהו מגדיר את עצמו כאבא
        IF EXISTS (
            SELECT 1
            FROM inserted i
            WHERE i.Person_Id = i.Father_Id
        )
        BEGIN
            RAISERROR('לא ניתן להגדיר את עצמך כאבא', 16, 1);
            ROLLBACK TRANSACTION;
            RETURN;
        END

        -- עדכון האב רק אם האב לא הוגדר קודם לכן
        UPDATE p
        SET p.Father_Id = i.Father_Id
        FROM People p
        INNER JOIN inserted i ON p.Person_Id = i.Person_Id
        WHERE p.Father_Id IS NULL AND i.Father_Id IS NOT NULL;

        -- עדכון טבלת קשרים (אם יש אבא חדש או הוגדר מחדש)
        IF EXISTS (
            SELECT 1
            FROM inserted i
            WHERE i.Father_Id IS NOT NULL
        )
        BEGIN
            -- הוספת קשר אב לילד
            INSERT INTO Family_Relations (Person_Id, Relative_Id, Connection_Type)
            SELECT i.Person_Id, i.Father_Id, 'Father'
            FROM inserted i
            LEFT JOIN Family_Relations fr ON fr.Person_Id = i.Person_Id AND fr.Relative_Id = i.Father_Id AND fr.Connection_Type = 'Father'
            WHERE fr.Person_Id IS NULL;

            -- הוספת קשר ילד לאבא
            INSERT INTO Family_Relations (Person_Id, Relative_Id, Connection_Type)
            SELECT i.Father_Id, i.Person_Id, 'Son' -- או 'Daughter' תלוי במגדר
            FROM inserted i
            LEFT JOIN Family_Relations fr ON fr.Person_Id = i.Father_Id AND fr.Relative_Id = i.Person_Id AND fr.Connection_Type = 'Son'
            WHERE fr.Person_Id IS NULL;
        END
    END

    -- חסימת עדכון אמא אם כבר קיים ערך
    IF UPDATE(Mother_Id)
    BEGIN
        -- חסימה אם מנסים לשנות אמא שכבר הוגדרה
        IF EXISTS (
            SELECT 1
            FROM inserted i
            INNER JOIN deleted d ON i.Person_Id = d.Person_Id
            WHERE d.Mother_Id IS NOT NULL AND i.Mother_Id <> d.Mother_Id
        )
        BEGIN
            RAISERROR('לא ניתן לשנות את האמא לאחר שהוגדרה', 16, 1);
            ROLLBACK TRANSACTION;
            RETURN;
        END
        
        -- בדיקה שהאדם שהוגדר כאמא היא נקבה
        IF EXISTS (
            SELECT 1
            FROM inserted i
            INNER JOIN People p ON i.Mother_Id = p.Person_Id
            WHERE p.Gender <> 'F'
        )
        BEGIN
            RAISERROR('האם חייבת להיות נקבה', 16, 1);
            ROLLBACK TRANSACTION;
            RETURN;
        END

        -- חסימה אם מישהו מגדיר את עצמו כאמא
        IF EXISTS (
            SELECT 1
            FROM inserted i
            WHERE i.Person_Id = i.Mother_Id
        )
        BEGIN
            RAISERROR('לא ניתן להגדיר את עצמך כאמא', 16, 1);
            ROLLBACK TRANSACTION;
            RETURN;
        END

        -- עדכון האמא רק אם האמא לא הוגדרה קודם לכן
        UPDATE p
        SET p.Mother_Id = i.Mother_Id
        FROM People p
        INNER JOIN inserted i ON p.Person_Id = i.Person_Id
        WHERE p.Mother_Id IS NULL AND i.Mother_Id IS NOT NULL;

        -- עדכון טבלת קשרים (אם יש אמא חדשה או הוגדרה מחדש)
        IF EXISTS (
            SELECT 1
            FROM inserted i
            WHERE i.Mother_Id IS NOT NULL
        )
        BEGIN
            -- הוספת קשר אם ילד לאמא
            INSERT INTO Family_Relations (Person_Id, Relative_Id, Connection_Type)
            SELECT i.Person_Id, i.Mother_Id, 'Mother'
            FROM inserted i
            LEFT JOIN Family_Relations fr ON fr.Person_Id = i.Person_Id AND fr.Relative_Id = i.Mother_Id AND fr.Connection_Type = 'Mother'
            WHERE fr.Person_Id IS NULL;

            -- הוספת קשר אם אמא לילד
            INSERT INTO Family_Relations (Person_Id, Relative_Id, Connection_Type)
            SELECT i.Mother_Id, i.Person_Id, 'Son' -- או 'Daughter' תלוי במגדר
            FROM inserted i
            LEFT JOIN Family_Relations fr ON fr.Person_Id = i.Mother_Id AND fr.Relative_Id = i.Person_Id AND fr.Connection_Type = 'Son'
            WHERE fr.Person_Id IS NULL;
        END
    END

    -- 2️⃣ טיפול בעדכון בן זוג
   IF UPDATE(Spouse_Id)
BEGIN
    -- 1. חסימה אם מנסים להציב בן זוג שכבר תפוס ע"י מישהו אחר
    IF EXISTS (
        SELECT 1 FROM inserted i
        INNER JOIN People p ON i.Spouse_Id = p.Person_Id
        WHERE i.Spouse_Id IS NOT NULL
          AND p.Spouse_Id IS NOT NULL
          AND p.Spouse_Id <> i.Person_Id
    )
    BEGIN
        RAISERROR('בן הזוג החדש אינו פנוי, לא ניתן לבצע עדכון.', 16, 1);
        ROLLBACK TRANSACTION;
        RETURN;
    END;

    -- 2. אם היה בן זוג קודם – ננקה לו את השדה Spouse_Id
    UPDATE p
    SET p.Spouse_Id = NULL
    FROM People p
    INNER JOIN deleted d ON p.Person_Id = d.Spouse_Id
    WHERE d.Spouse_Id IS NOT NULL;

    -- 3. נעדכן את הרשומה עצמה לשדה Spouse_Id החדש (יכול להיות גם NULL)
    UPDATE p
    SET p.Spouse_Id = i.Spouse_Id
    FROM People p
    INNER JOIN inserted i ON p.Person_Id = i.Person_Id;

    -- 4. אם יש בן זוג חדש – נעדכן גם אותו
    UPDATE p
    SET p.Spouse_Id = i.Person_Id
    FROM People p
    INNER JOIN inserted i ON p.Person_Id = i.Spouse_Id
    WHERE i.Spouse_Id IS NOT NULL;

    -- 5. מחיקת כל קשרים ישנים מסוג Spouse (מהרשומה ומהבן זוג הישן)
    DELETE FR
    FROM Family_Relations FR
    INNER JOIN deleted d ON 
        (FR.Person_Id = d.Person_Id AND FR.Connection_Type = 'Spouse')
        OR (FR.Relative_Id = d.Person_Id AND FR.Connection_Type = 'Spouse');

    -- 6. הוספת קשרי Spouse חדשים (דו-כיווניים)
    INSERT INTO Family_Relations (Person_Id, Relative_Id, Connection_Type)
    SELECT i.Person_Id, i.Spouse_Id, 'Spouse'
    FROM inserted i
    INNER JOIN People p ON i.Spouse_Id = p.Person_Id
    WHERE i.Spouse_Id IS NOT NULL;

    INSERT INTO Family_Relations (Person_Id, Relative_Id, Connection_Type)
    SELECT i.Spouse_Id, i.Person_Id, 'Spouse'
    FROM inserted i
    INNER JOIN People p ON i.Spouse_Id = p.Person_Id
    WHERE i.Spouse_Id IS NOT NULL;
END
END;

CREATE TRIGGER trg_LockInsert_FamilyRelations
ON Family_Relations
INSTEAD OF INSERT
AS
BEGIN
    DECLARE @context VARBINARY(128);
    SELECT @context = CONTEXT_INFO();

    IF @context = CONVERT(VARBINARY(128), 'PeopleTrigger')
    BEGIN
        INSERT INTO Family_Relations (Person_Id, Relative_Id, Connection_Type)
        SELECT Person_Id, Relative_Id, Connection_Type FROM inserted;
    END
    ELSE
    BEGIN
        RAISERROR('אין הרשאה להוספת קשרים בטבלה Family_Relations באופן ישיר', 16, 1);
        ROLLBACK TRANSACTION;
    END
END

CREATE TRIGGER trg_LockDelete_FamilyRelations
ON Family_Relations
INSTEAD OF DELETE
AS
BEGIN
    DECLARE @context VARBINARY(128);
    SELECT @context = CONTEXT_INFO();

    IF @context = CONVERT(VARBINARY(128), 'PeopleTrigger')
    BEGIN
        DELETE FR
        FROM Family_Relations FR
        INNER JOIN deleted d ON FR.Person_Id = d.Person_Id
                            AND FR.Relative_Id = d.Relative_Id
                            AND FR.Connection_Type = d.Connection_Type;
    END
    ELSE
    BEGIN
        RAISERROR('אין הרשאה למחיקת קשרים בטבלה Family_Relations באופן ישיר', 16, 1);
        ROLLBACK TRANSACTION;
    END
END

CREATE TRIGGER trg_LockUpdate_FamilyRelations
ON Family_Relations
INSTEAD OF UPDATE
AS
BEGIN
    DECLARE @context VARBINARY(128);
    SELECT @context = CONTEXT_INFO();

    IF @context = CONVERT(VARBINARY(128), 'PeopleTrigger')
    BEGIN
        UPDATE FR
        SET Person_Id = i.Person_Id,
            Relative_Id = i.Relative_Id,
            Connection_Type = i.Connection_Type
        FROM Family_Relations FR
        INNER JOIN inserted i ON FR.Person_Id = i.Person_Id
                             AND FR.Relative_Id = i.Relative_Id
    END
    ELSE
    BEGIN
        RAISERROR('אין הרשאה לעדכן קשרים בטבלה Family_Relations באופן ישיר', 16, 1);
        ROLLBACK TRANSACTION;
    END
END
INSERT INTO People (Person_Id, Personal_Name, Family_Name, Gender)
VALUES ('000000001', 'אברהם', 'אבינו', 'M');
INSERT INTO People (Person_Id, Personal_Name, Family_Name, Gender,Spouse_Id)
VALUES ('000000002', 'שרה', 'אמנו', 'F','000000001');
INSERT INTO People (Person_Id, Personal_Name, Family_Name, Gender,Spouse_Id)
VALUES ('000000003', 'שרה', 'אמנו', 'F','000000001');
INSERT INTO People (Person_Id, Personal_Name, Family_Name, Gender, Father_Id, Mother_Id)
VALUES ('000000004', 'יצחק', 'אבינו', 'M', '000000001', '000000002');

-- הוספת עשיו (הבן של יצחק)
INSERT INTO People (Person_Id, Personal_Name, Family_Name, Gender, Father_Id, Mother_Id)
VALUES ('000000005', 'עשיו', 'אבינו', 'M', '000000004', NULL)

INSERT INTO People (Person_Id, Personal_Name, Family_Name, Gender, Father_Id, Mother_Id)
VALUES ('000000006', 'יעקב', 'אבינו', 'M', '000000004', NULL);

INSERT INTO People (Person_Id, Personal_Name, Family_Name, Gender, Spouse_Id)
VALUES ('000000003', 'רבקה', 'אמנו', 'F', '000000004');


select *
from People
SELECT *
FROM Family_Relations

SELECT 
    spid,
    dbid,
    loginame
FROM sys.sysprocesses
WHERE 
    dbid = DB_ID('FamilyDB1');