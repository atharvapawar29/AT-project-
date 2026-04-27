#include <stdint.h>
#include <stdio.h>

#define MAX_STATES 20
#define MAX_TRANSITIONS 300

typedef struct {
    int from;
    char symbol;
    int to;
} Transition;

int contains(int arr[], int n, int x) {
    for (int i = 0; i < n; i++) {
        if (arr[i] == x) return 1;
    }
    return 0;
}

uint64_t bit(int x) {
    return 1ULL << x;
}

int subset_index(uint64_t subsets[], int n, uint64_t target) {
    for (int i = 0; i < n; i++) {
        if (subsets[i] == target) return i;
    }
    return -1;
}

void print_subset(uint64_t mask, int n_states) {
    printf("{");
    int first = 1;
    for (int i = 0; i < n_states; i++) {
        if (mask & bit(i)) {
            if (!first) printf(",");
            printf("%d", i);
            first = 0;
        }
    }
    printf("}");
}

int main(void) {
    int n_states, start_state, n_final, n_trans;
    int finals[MAX_STATES];
    Transition tr[MAX_TRANSITIONS];

    printf("Enter number of NFA states (<=20): ");
    scanf("%d", &n_states);
    if (n_states > 20) {
        printf("Please keep states <= 20 for this simple version.\n");
        return 1;
    }

    printf("Enter start state: ");
    scanf("%d", &start_state);

    printf("Enter number of final states: ");
    scanf("%d", &n_final);
    printf("Enter final states: ");
    for (int i = 0; i < n_final; i++) scanf("%d", &finals[i]);

    printf("Enter number of transitions: ");
    scanf("%d", &n_trans);
    printf("Enter each transition as: from symbol to\n");
    for (int i = 0; i < n_trans; i++) {
        scanf("%d %c %d", &tr[i].from, &tr[i].symbol, &tr[i].to);
    }

    char alphabet[MAX_STATES];
    int alpha_count = 0;
    for (int i = 0; i < n_trans; i++) {
        char s = tr[i].symbol;
        int seen = 0;
        for (int j = 0; j < alpha_count; j++) {
            if (alphabet[j] == s) seen = 1;
        }
        if (!seen) alphabet[alpha_count++] = s;
    }

    uint64_t subsets[MAX_STATES];
    int queue[MAX_STATES];
    int qh = 0, qt = 0;
    int subset_count = 0;

    Transition dfa_tr[MAX_TRANSITIONS];
    int dfa_tr_count = 0;

    uint64_t start_subset = bit(start_state);
    subsets[subset_count++] = start_subset;
    queue[qt++] = 0;

    while (qh < qt) {
        int from_idx = queue[qh++];
        uint64_t from_set = subsets[from_idx];

        for (int a = 0; a < alpha_count; a++) {
            char sym = alphabet[a];
            uint64_t to_set = 0;

            for (int s = 0; s < n_states; s++) {
                if (!(from_set & bit(s))) continue;
                for (int t = 0; t < n_trans; t++) {
                    if (tr[t].from == s && tr[t].symbol == sym) {
                        to_set |= bit(tr[t].to);
                    }
                }
            }

            if (to_set == 0) continue;

            int to_idx = subset_index(subsets, subset_count, to_set);
            if (to_idx < 0) {
                to_idx = subset_count;
                subsets[subset_count++] = to_set;
                queue[qt++] = to_idx;
            }

            dfa_tr[dfa_tr_count++] = (Transition){from_idx, sym, to_idx};
        }
    }

    int dfa_finals[MAX_STATES], dfa_final_count = 0;
    for (int i = 0; i < subset_count; i++) {
        for (int f = 0; f < n_final; f++) {
            if (subsets[i] & bit(finals[f])) {
                dfa_finals[dfa_final_count++] = i;
                break;
            }
        }
    }

    printf("\nDFA State Mapping\n");
    for (int i = 0; i < subset_count; i++) {
        printf("D%d = ", i);
        print_subset(subsets[i], n_states);
        printf("\n");
    }

    printf("\nDFA Transition Table\n");
    printf("From\tSymbol\tTo\n");
    for (int i = 0; i < dfa_tr_count; i++) {
        printf("D%d\t%c\tD%d\n", dfa_tr[i].from, dfa_tr[i].symbol, dfa_tr[i].to);
    }

    printf("\nDFA Start State: D0\n");
    printf("DFA Final States: ");
    for (int i = 0; i < dfa_final_count; i++) {
        printf("D%d ", dfa_finals[i]);
    }
    printf("\n");

    return 0;
}