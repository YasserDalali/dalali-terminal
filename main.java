package banque.util;

import java.util.Arrays;

interface Remunerable {
    void appliquerRemuneration();
}

interface ComparableCompte<T> {
    int comparerSolde(T autre);
    boolean estPlusRicheQue(T autre);
}

abstract class Compte {
    protected String numero;
    protected double solde;

    public Compte(String numero, double solde) {
        this.numero = numero;
        this.solde = solde;
    }

    public double getSolde() {
        return solde;
    }

    public abstract void afficherDetails();
}

class CompteCourant extends Compte implements ComparableCompte<CompteCourant> {
    public CompteCourant(String numero, double solde) {
        super(numero, solde);
    }

    @Override
    public void afficherDetails() {
        System.out.println("Compte Courant - N°: " + numero + " | Solde: " + solde);
    }

    @Override
    public int comparerSolde(CompteCourant autre) {
        return Double.compare(this.solde, autre.solde);
    }

    @Override
    public boolean estPlusRicheQue(CompteCourant autre) {
        return this.solde > autre.solde;
    }
}

class CompteEpargne extends Compte implements Remunerable, ComparableCompte<CompteEpargne> {
    private double taux;

    public CompteEpargne(String numero, double solde, double taux) {
        super(numero, solde);
        this.taux = taux;
    }

    @Override
    public void appliquerRemuneration() {
        this.solde += this.solde * taux;
    }

    @Override
    public void afficherDetails() {
        System.out.println("Compte Epargne - N°: " + numero + " | Solde: " + solde + " | Taux: " + taux);
    }

    @Override
    public int comparerSolde(CompteEpargne autre) {
        return Double.compare(this.solde, autre.solde);
    }

    @Override
    public boolean estPlusRicheQue(CompteEpargne autre) {
        return this.solde > autre.solde;
    }
}

class BanqueUtils {
    public static <T extends Compte> T trouverCompteMaxSolde(T[] comptes) {
        if (comptes == null || comptes.length == 0) return null;
        T max = comptes[0];
        for (T c : comptes) {
            if (c.getSolde() > max.getSolde()) max = c;
        }
        return max;
    }

    public static <T extends Compte> void afficherComptesAuDessusDe(T[] comptes, double soldeMin) {
        for (T c : comptes) {
            if (c.getSolde() >= soldeMin) c.afficherDetails();
        }
    }

    public static <T extends Remunerable> void appliquerRemunerationATous(T[] comptes) {
        for (T c : comptes) {
            c.appliquerRemuneration();
        }
    }
}

class Rapport<T extends Compte> {
    private T[] comptes;
    private String titre;

    public Rapport(String titre, T[] comptes) {
        this.titre = titre;
        this.comptes = comptes;
    }

    public void genererRapport() {
        System.out.println("--- " + titre + " ---");
        double total = 0;
        for (T c : comptes) {
            c.afficherDetails();
            total += c.getSolde();
        }
        System.out.println("Solde Total: " + total);
        T max = BanqueUtils.trouverCompteMaxSolde(comptes);
        if (max != null) {
            System.out.print("Compte Max: ");
            max.afficherDetails();
        }
        System.out.println("---------------------------");
    }
}

class GestionnaireComptes<T extends Compte> {
    private String nomAgence;
    private T[] comptes;

    public GestionnaireComptes(String nomAgence, T[] comptes) {
        this.nomAgence = nomAgence;
        this.comptes = comptes;
    }

    public void afficherTousLesComptes() {
        System.out.println("Agence: " + nomAgence);
        for (T c : comptes) c.afficherDetails();
    }

    public double calculerSoldeTotal() {
        double total = 0;
        for (T c : comptes) total += c.getSolde();
        return total;
    }
}

public class Main {
    public static void main(String[] args) {
        CompteCourant[] ccArr = {
            new CompteCourant("CC01", 2000),
            new CompteCourant("CC02", 5000)
        };
        CompteEpargne[] ceArr = {
            new CompteEpargne("CE01", 4000, 0.05),
            new CompteEpargne("CE02", 10000, 0.05)
        };

        GestionnaireComptes<CompteCourant> g1 = new GestionnaireComptes<>("EMS-C", ccArr);
        GestionnaireComptes<CompteEpargne> g2 = new GestionnaireComptes<>("EMS-E", ceArr);

        g1.afficherTousLesComptes();
        System.out.println("Total: " + g1.calculerSoldeTotal());
        g2.afficherTousLesComptes();
        System.out.println("Total: " + g2.calculerSoldeTotal());

        System.out.println("Comparaison: " + ccArr[0].comparerSolde(ccArr[1]));
        System.out.println("Plus riche: " + ccArr[1].estPlusRicheQue(ccArr[0]));

        System.out.println("Comptes Epargne >= 5000:");
        BanqueUtils.afficherComptesAuDessusDe(ceArr, 5000);
        BanqueUtils.appliquerRemunerationATous(ceArr);
        System.out.println("Après rémunération:");
        for(CompteEpargne ce : ceArr) ce.afficherDetails();

        Rapport<CompteCourant> r1 = new Rapport<>("Rapport Courants", ccArr);
        Rapport<CompteEpargne> r2 = new Rapport<>("Rapport Epargnes", ceArr);
        r1.genererRapport();
        r2.genererRapport();
    }
}